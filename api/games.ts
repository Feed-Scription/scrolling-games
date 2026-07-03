import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

// 初始化 Redis（需要在 Vercel 环境变量中配置 UPSTASH_REDIS_REST_URL 和 UPSTASH_REDIS_REST_TOKEN）
function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

interface CachedGame {
  id: string
  title: string
  description: string
  html: string
  prompt: string
  model: string
  createdAt: number
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const redis = getRedis()

  // GET - 获取缓存的游戏列表或单个游戏
  if (req.method === 'GET') {
    if (!redis) {
      return res.status(200).json({ games: [], message: 'Redis not configured' })
    }

    try {
      const { id, limit = '20', offset = '0' } = req.query as Record<string, string>

      if (id) {
        // 获取单个游戏
        const game = await redis.hget<CachedGame>('games', id)
        if (!game) {
          return res.status(404).json({ error: 'Game not found' })
        }
        return res.status(200).json(game)
      }

      // 获取游戏列表
      const allIds = await redis.smembers('game_ids') as string[]
      const start = parseInt(offset)
      const count = parseInt(limit)
      const pageIds = allIds.slice(start, start + count)

      const games: CachedGame[] = []
      for (const gid of pageIds) {
        const game = await redis.hget<CachedGame>('games', gid)
        if (game) games.push(game)
      }

      return res.status(200).json({
        games,
        total: allIds.length,
        hasMore: start + count < allIds.length,
      })
    } catch (error) {
      console.error('Redis GET error:', error)
      return res.status(500).json({ error: 'Failed to read from cache' })
    }
  }

  // POST - 保存生成的游戏
  if (req.method === 'POST') {
    if (!redis) {
      return res.status(200).json({ saved: false, message: 'Redis not configured' })
    }

    try {
      const game: CachedGame = req.body

      if (!game.id || !game.html) {
        return res.status(400).json({ error: 'Missing id or html' })
      }

      // 保存游戏详情
      await redis.hset('games', { [game.id]: game })

      // 添加到 ID 集合
      await redis.sadd('game_ids', game.id)

      // 限制总量（保留最近 500 个）
      const allIds = await redis.smembers('game_ids') as string[]
      if (allIds.length > 500) {
        const toRemove = allIds.slice(0, allIds.length - 500)
        for (const rid of toRemove) {
          await redis.hdel('games', rid)
          await redis.srem('game_ids', rid)
        }
      }

      return res.status(200).json({ saved: true, id: game.id })
    } catch (error) {
      console.error('Redis POST error:', error)
      return res.status(500).json({ error: 'Failed to save game' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
