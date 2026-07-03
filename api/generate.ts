import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt, model } = req.body

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' })
  }

  const apiKey = process.env.API_KEY
  const baseUrl = process.env.BASE_URL || 'https://api.xiaomimimo.com/v1'
  const modelName = model || process.env.MODEL || 'xiaomi/mimo-v2.5-pro-ultraspeed'

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' })
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        max_tokens: 8192,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Upstream API error:', response.status, errorText)
      return res.status(response.status).json({ error: `Upstream API error: ${errorText}` })
    }

    if (!response.body) {
      return res.status(500).json({ error: 'Upstream returned no body' })
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('X-Accel-Buffering', 'no')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let hasWritten = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      if (chunk.length > 0) {
        hasWritten = true
        fullText += chunk
        res.write(chunk)
        if (typeof (res as any).flush === 'function') {
          (res as any).flush()
        }
      }
    }

    res.end()

    // 异步保存到缓存（不阻塞响应）
    saveToCache(fullText, prompt, modelName).catch(err => {
      console.error('Cache save error:', err)
    })
  } catch (error) {
    console.error('Proxy error:', error)
    if (!res.headersSent) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      })
    }
  }
}

async function saveToCache(rawText: string, prompt: string, model: string) {
  const redis = getRedis()
  if (!redis) return

  // 从响应中提取 HTML
  const htmlMatch = rawText.match(/```(?:html)?\s*\n?([\s\S]*?)```/)
    || rawText.match(/<!DOCTYPE html[\s\S]*<\/html>/i)
    || rawText.match(/<html[\s\S]*<\/html>/i)

  const html = htmlMatch ? (htmlMatch[1] || htmlMatch[0]).trim() : rawText.trim()
  if (!html || html.length < 200) return

  // 提取标题
  const titleMatch = html.match(/<title>(.*?)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : '未命名游戏'

  const id = `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  await redis.hset('games', {
    [id]: {
      id,
      title,
      html,
      prompt: prompt.slice(0, 500),
      model,
      createdAt: Date.now(),
    }
  })

  await redis.sadd('game_ids', id)

  // 清理旧数据（保留最近 500 个）
  const allIds = await redis.smembers('game_ids') as string[]
  if (allIds.length > 500) {
    const toRemove = allIds.slice(0, allIds.length - 500)
    for (const rid of toRemove) {
      await redis.hdel('games', rid)
      await redis.srem('game_ids', rid)
    }
  }
}
