import { ref, watch } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useGameGenerator } from './useGameGenerator'
import { useUserMemory } from './useUserMemory'
import { useSettings } from './useSettings'
import { getPrebuiltGames } from '../pregames'
import { extractGameTitle, extractGameDescription } from '../utils/htmlParser'
import type { Game } from '../types'

export function useGameManager() {
  const store = useGameStore()
  const { gameState, addGame, updateGame, setCurrentIndex, clearGames, getUnplayedCount, getGeneratingCount } = store
  const { generateGame, isGenerating } = useGameGenerator()
  const { memoryContext, addGameHistory } = useUserMemory()
  const { settings, canGenerate } = useSettings()
  
  const isInitialized = ref(false)
  const generatingGameId = ref<string | null>(null)
  const gameStartTime = ref<number>(0)
  const currentGameId = ref<string | null>(null)
  const initError = ref<string | null>(null)
  const retryCount = ref(0)

  // 获取最近生成的游戏描述列表（用于多样性控制）
  function getRecentGameDescriptions(): string[] {
    return gameState.games
      .filter(g => g.status === 'ready' && g.title && g.description)
      .slice(-10)
      .map(g => `${g.title}（${g.description}）`)
  }

  // 监听 apiKey 变化
  watch(() => settings.value.apiKey, (newKey, oldKey) => {
    if (newKey && newKey !== oldKey) {
      resetAndInitialize()
    }
  })

  async function resetAndInitialize() {
    isInitialized.value = false
    initError.value = null
    retryCount.value = 0
    clearGames()
    await initializeGames()
  }

  // 重置所有（保留预置游戏和设置）
  function resetAll() {
    isInitialized.value = false
    initError.value = null
    retryCount.value = 0
    clearGames()
    // 重新加载预置游戏
    const prebuiltGames = getPrebuiltGames()
    prebuiltGames.forEach(game => addGame(game))
    setCurrentIndex(0)
  }

  async function initializeGames() {
    if (isInitialized.value) return
    
    isInitialized.value = true
    initError.value = null

    // 如果本地没有缓存的游戏，加载预置游戏
    if (gameState.games.length === 0) {
      const prebuiltGames = getPrebuiltGames()
      prebuiltGames.forEach(game => addGame(game))
    }

    fillUnplayedQueue()
  }

  function fillUnplayedQueue() {
    if (!canGenerate()) return
    const { maxConcurrent, maxUnplayed, maxTotal } = settings.value

    if (getGeneratingCount() >= maxConcurrent) return
    if (getUnplayedCount() >= maxUnplayed) return
    if (gameState.games.filter(g => g.status === 'ready').length >= maxTotal) return

    generateNextGame()
  }

  async function generateNextGame() {
    if (isGenerating.value) return
    if (!canGenerate()) return

    const total = gameState.games.filter(g => g.status === 'ready').length
    if (total >= settings.value.maxTotal) return

    const gameId = `gen_${Date.now()}`
    generatingGameId.value = gameId

    const placeholder: Game = {
      id: gameId,
      title: '生成中...',
      html: '',
      status: 'generating',
      generatedAt: Date.now(),
      generationTime: 0,
      tokenSpeed: 0,
    }
    addGame(placeholder)

    try {
      const recentDescriptions = getRecentGameDescriptions()
      const game = await generateGame(
        memoryContext.value,
        (text) => {
          updateGame(gameId, { rawText: text })
        },
        undefined,
        recentDescriptions,
      )

      if (game) {
        const realTitle = extractGameTitle(game.html) || '未知游戏'
        const description = extractGameDescription(game.html)
        updateGame(gameId, {
          title: realTitle,
          description,
          html: game.html,
          status: game.status,
          generationTime: game.generationTime,
          tokenSpeed: game.tokenSpeed,
          rawText: undefined,
        })
        retryCount.value = 0
      }
    } catch (error) {
      console.error('Game generation failed:', error)
      
      // 任何错误都丢弃并重试（最多3次）
      if (retryCount.value < 3) {
        retryCount.value++
        const failIdx = gameState.games.findIndex(g => g.id === gameId)
        if (failIdx !== -1) gameState.games.splice(failIdx, 1)
        generatingGameId.value = null
        setTimeout(() => generateNextGame(), 500)
        return
      }
      
      // 重试3次都失败，静默移除，不展示错误页面
      const failIdx = gameState.games.findIndex(g => g.id === gameId)
      if (failIdx !== -1) gameState.games.splice(failIdx, 1)
      retryCount.value = 0
    } finally {
      generatingGameId.value = null
      setTimeout(fillUnplayedQueue, 500)
    }
  }

  function onGameEnter() {
    const currentGame = gameState.games[gameState.currentIndex]
    if (currentGame) {
      gameStartTime.value = Date.now()
      currentGameId.value = currentGame.id
    }
  }

  function onGameLeave() {
    if (currentGameId.value && gameStartTime.value > 0) {
      const duration = Math.round((Date.now() - gameStartTime.value) / 1000)
      const game = gameState.games.find(g => g.id === currentGameId.value)
      
      if (game && duration > 0 && game.status === 'ready') {
        addGameHistory({
          gameId: game.id,
          gameType: game.title || '未知游戏',
          gameDescription: game.description || '',
          playDuration: duration,
          liked: duration > 10,
        })
      }

      gameStartTime.value = 0
      currentGameId.value = null
    }
  }

  function goToNext() {
    onGameLeave()
    
    // 如果当前游戏正在生成，不允许继续往下
    const currentGame = gameState.games[gameState.currentIndex]
    if (currentGame && currentGame.status === 'generating') {
      onGameEnter()
      return
    }
    
    if (gameState.currentIndex < gameState.games.length - 1) {
      setCurrentIndex(gameState.currentIndex + 1)
      onGameEnter()
    }
    
    fillUnplayedQueue()
  }

  function goToPrev() {
    onGameLeave()
    
    if (gameState.currentIndex > 0) {
      setCurrentIndex(gameState.currentIndex - 1)
      onGameEnter()
    }
  }

  return {
    gameState,
    isInitialized,
    isGenerating,
    generatingGameId,
    initError,
    initializeGames,
    resetAndInitialize,
    resetAll,
    generateNextGame,
    fillUnplayedQueue,
    goToNext,
    goToPrev,
    onGameEnter,
    onGameLeave,
  }
}
