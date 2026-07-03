import type { VercelRequest, VercelResponse } from '@vercel/node'

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

    // 检查上游是否返回流
    if (!response.body) {
      return res.status(500).json({ error: 'Upstream returned no body' })
    }

    // 流式转发 - 关键：不设置 Content-Length，让数据自然流出
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('X-Accel-Buffering', 'no')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let hasWritten = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      if (chunk.length > 0) {
        hasWritten = true
        res.write(chunk)
        // 确保数据立即发送，不被缓冲
        if (typeof (res as any).flush === 'function') {
          (res as any).flush()
        }
      }
    }

    if (!hasWritten) {
      console.warn('No data was written to response')
    }

    res.end()
  } catch (error) {
    console.error('Proxy error:', error)
    // 确保错误时也返回 JSON
    if (!res.headersSent) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      })
    }
  }
}
