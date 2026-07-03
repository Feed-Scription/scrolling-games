export interface Game {
  id: string
  title: string
  description?: string  // 游戏核心机制描述
  html: string
  status: 'generating' | 'ready' | 'played'
  generatedAt: number
  generationTime: number
  tokenSpeed: number
  rawText?: string
}

export interface GameState {
  games: Game[]
  currentIndex: number
  isGenerating: boolean
}

export interface Settings {
  model: string
  baseUrl: string
  apiKey: string
  maxConcurrent: number   // 最大同时生成数
  maxUnplayed: number     // 最大未玩游戏数（缓存池大小）
  maxTotal: number        // 最大总游戏数
}

export interface UserMemory {
  selectedTags: string[]
  gameHistory: GameHistoryItem[]
  inferredPreferences: string
  lastUpdated: number
  isFirstVisit: boolean
}

export interface GameHistoryItem {
  gameId: string
  gameType: string
  gameDescription: string  // 游戏核心机制描述
  playDuration: number
  liked?: boolean
  timestamp: number
}

export type Page = 'game' | 'memory' | 'settings' | 'export'

export const GAME_TAGS = [
  '三消', '休闲', '益智', '动作', '射击',
  '跑酷', '音乐', '策略', '竞速', '解谜',
  '放置', '卡牌', 'RPG', '模拟', '街机'
] as const

export const DEFAULT_SETTINGS: Settings = {
  model: import.meta.env.VITE_MODEL || 'xiaomi/mimo-v2.5-pro-ultraspeed',
  baseUrl: import.meta.env.VITE_BASE_URL || 'https://api.xiaomimimo.com/v1',
  apiKey: import.meta.env.VITE_API_KEY || '',
  maxConcurrent: 1,
  maxUnplayed: 5,
  maxTotal: 10,
}
