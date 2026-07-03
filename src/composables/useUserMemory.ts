import { ref, computed } from 'vue'
import type { UserMemory, GameHistoryItem } from '../types'
import { buildMemoryAnalysisPrompt } from '../prompts/gamePrompt'
import { useSettings } from './useSettings'

const MEMORY_KEY = 'sg_user_memory'

function loadMemory(): UserMemory {
  try {
    const stored = localStorage.getItem(MEMORY_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore parse errors
  }
  return {
    selectedTags: [],
    gameHistory: [],
    inferredPreferences: '',
    lastUpdated: Date.now(),
    isFirstVisit: true,
  }
}

const memory = ref<UserMemory>(loadMemory())

export function useUserMemory() {
  const { settings } = useSettings()

  function saveMemory() {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory.value))
  }

  function setSelectedTags(tags: string[]) {
    memory.value.selectedTags = tags
    memory.value.isFirstVisit = false
    saveMemory()
  }

  function completeOnboarding() {
    memory.value.isFirstVisit = false
    saveMemory()
  }

  function addGameHistory(item: Omit<GameHistoryItem, 'timestamp'>) {
    memory.value.gameHistory.push({
      ...item,
      timestamp: Date.now(),
    })
    saveMemory()

    // Analyze preferences every 5 games
    if (memory.value.gameHistory.length % 5 === 0) {
      analyzePreferences()
    }
  }

  async function analyzePreferences() {
    if (!settings.value.apiKey) return

    const historySummary = memory.value.gameHistory
      .slice(-10)
      .map(h => `- ${h.gameType}${h.gameDescription ? '（' + h.gameDescription + '）' : ''}: 玩了${h.playDuration}秒${h.liked ? ', 喜欢' : ''}`)
      .join('\n')

    const prompt = buildMemoryAnalysisPrompt(historySummary)

    try {
      const response = await fetch(`${settings.value.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.value.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.value.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
        }),
      })

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      if (content) {
        memory.value.inferredPreferences = content.trim()
        memory.value.lastUpdated = Date.now()
        saveMemory()
      }
    } catch {
      // Silently fail
    }
  }

  function resetMemory() {
    memory.value = {
      selectedTags: [],
      gameHistory: [],
      inferredPreferences: '',
      lastUpdated: Date.now(),
      isFirstVisit: true,
    }
    saveMemory()
  }

  const memoryContext = computed(() => {
    const parts: string[] = []
    
    if (memory.value.selectedTags.length > 0) {
      parts.push(`用户喜欢的游戏类型：${memory.value.selectedTags.join('、')}`)
    }
    
    if (memory.value.inferredPreferences) {
      parts.push(`用户偏好：${memory.value.inferredPreferences}`)
    }

    // 最近玩过的游戏及其机制描述
    const recentHistory = memory.value.gameHistory.slice(-5)
    if (recentHistory.length > 0) {
      const gameDescriptions = recentHistory
        .map(h => `${h.gameType}${h.gameDescription ? '（' + h.gameDescription + '）' : ''}`)
        .join('、')
      parts.push(`最近玩过：${gameDescriptions}`)
      
      const avgDuration = recentHistory.reduce((sum, h) => sum + h.playDuration, 0) / recentHistory.length
      parts.push(`最近平均游玩时长：${avgDuration.toFixed(0)}秒`)
    }

    return parts.join('\n')
  })

  return {
    memory,
    setSelectedTags,
    completeOnboarding,
    addGameHistory,
    resetMemory,
    memoryContext,
  }
}
