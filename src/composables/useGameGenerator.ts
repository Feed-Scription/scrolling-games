import { ref } from 'vue'
import { useSettings } from './useSettings'
import { buildGamePrompt } from '../prompts/gamePrompt'
import { extractHtmlFromResponse, parseSSEChunk, generateId, validateGameHtml } from '../utils/htmlParser'
import type { Game } from '../types'

export function useGameGenerator() {
  const { settings } = useSettings()
  const isGenerating = ref(false)
  const currentProgress = ref('')
  const tokenCount = ref(0)
  const startTime = ref(0)

  async function generateGame(
    userMemory: string,
    onProgress?: (text: string) => void,
    gameTypeHint?: string,
    recentGameDescriptions?: string[],
  ): Promise<Game | null> {
    if (!settings.value.apiKey) {
      throw new Error('请先配置 API Key')
    }

    isGenerating.value = true
    currentProgress.value = ''
    tokenCount.value = 0
    startTime.value = Date.now()

    const prompt = buildGamePrompt(userMemory, gameTypeHint, recentGameDescriptions)

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
          stream: true,
          max_tokens: 8192,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`API 请求失败: ${response.status} ${error}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const content = parseSSEChunk(chunk)
        if (content) {
          fullText += content
          tokenCount.value += content.length
          currentProgress.value = fullText
          onProgress?.(fullText)
        }
      }

      const html = extractHtmlFromResponse(fullText)
      const elapsed = Date.now() - startTime.value

      // 验证生成的 HTML 是否有效
      const validation = validateGameHtml(html)
      if (!validation.valid) {
        throw new Error(`生成的游戏无效: ${validation.reason}`)
      }

      const game: Game = {
        id: generateId(),
        title: '',
        html,
        status: 'ready',
        generatedAt: Date.now(),
        generationTime: elapsed,
        tokenSpeed: Math.round((tokenCount.value / elapsed) * 1000),
        rawText: fullText,
      }

      return game
    } catch (error) {
      throw error
    } finally {
      isGenerating.value = false
    }
  }

  async function testConnection(): Promise<{ success: boolean; message: string }> {
    if (!settings.value.apiKey) {
      return { success: false, message: '请先填写 API Key' }
    }

    try {
      const response = await fetch(`${settings.value.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${settings.value.apiKey}`,
        },
      })

      if (response.ok) {
        return { success: true, message: '连接成功！' }
      } else {
        return { success: false, message: `连接失败: ${response.status}` }
      }
    } catch (error) {
      return { success: false, message: `连接错误: ${error}` }
    }
  }

  return {
    isGenerating,
    currentProgress,
    tokenCount,
    startTime,
    generateGame,
    testConnection,
  }
}
