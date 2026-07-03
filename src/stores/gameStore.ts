import { reactive } from 'vue'
import type { GameState } from '../types'

const GAMES_STORAGE_KEY = 'sg_games_state'

function loadPersistedState(): Partial<GameState> {
  try {
    const stored = localStorage.getItem(GAMES_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // 只恢复 ready 状态的游戏（丢弃 generating 的）
      return {
        games: (parsed.games || []).filter((g: any) => g.status === 'ready'),
        currentIndex: Math.min(parsed.currentIndex || 0, (parsed.games || []).length - 1),
      }
    }
  } catch { /* ignore */ }
  return {}
}

function persistState(state: GameState) {
  try {
    // 只持久化 ready 状态的游戏，不存 rawText（太大）
    const toSave = {
      currentIndex: state.currentIndex,
      games: state.games
        .filter(g => g.status === 'ready')
        .map(g => ({
          id: g.id,
          title: g.title,
          description: g.description,
          html: g.html,
          status: g.status,
          generatedAt: g.generatedAt,
          generationTime: g.generationTime,
          tokenCount: g.tokenCount,
          tokenSpeed: g.tokenSpeed,
        })),
    }
    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(toSave))
  } catch { /* storage full or unavailable */ }
}

const persisted = loadPersistedState()

export const gameState = reactive<GameState>({
  games: persisted.games || [],
  currentIndex: persisted.currentIndex || 0,
  isGenerating: false,
})

export function useGameStore() {
  function addGame(game: GameState['games'][0]) {
    gameState.games.push(game)
    persistState(gameState)
  }

  function updateGame(id: string, updates: Partial<GameState['games'][0]>) {
    const index = gameState.games.findIndex(g => g.id === id)
    if (index !== -1) {
      Object.assign(gameState.games[index], updates)
      persistState(gameState)
    }
  }

  function clearGames() {
    gameState.games = []
    gameState.currentIndex = 0
    persistState(gameState)
  }

  function setCurrentIndex(index: number) {
    gameState.currentIndex = Math.max(0, Math.min(index, gameState.games.length - 1))
    persistState(gameState)
  }

  function getReadyGames() {
    return gameState.games.filter(g => g.status === 'ready' || g.status === 'played')
  }

  function getCurrentGame() {
    return gameState.games[gameState.currentIndex]
  }

  function getGameCount() {
    return gameState.games.filter(g => g.status === 'ready' || g.status === 'played').length
  }

  function getGeneratingCount() {
    return gameState.games.filter(g => g.status === 'generating').length
  }

  function getUnplayedCount() {
    // 从 currentIndex 之后的 ready 游戏数
    return gameState.games.slice(gameState.currentIndex + 1).filter(g => g.status === 'ready').length
  }

  return {
    gameState,
    addGame,
    updateGame,
    clearGames,
    setCurrentIndex,
    getReadyGames,
    getCurrentGame,
    getGameCount,
    getGeneratingCount,
    getUnplayedCount,
  }
}
