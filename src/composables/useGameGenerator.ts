import { ref } from 'vue'
import { useSettings } from './useSettings'
import { buildGamePrompt } from '../prompts/gamePrompt'
import { extractHtmlFromResponse, extractContentFromBuffer, extractReasoningFromBuffer, extractUsageFromBuffer, generateId, validateGameHtml } from '../utils/htmlParser'
import type { Game } from '../types'

// 检测是否在 Vercel 环境（有 /api 路由）
const isVercelEnv = typeof window !== 'undefined' && (
  window.location.hostname.includes('vercel.app')
  || window.location.hostname.includes('feedscription.com')
)

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
    isGenerating.value = true
    currentProgress.value = ''
    tokenCount.value = 0
    startTime.value = Date.now()

    const prompt = buildGamePrompt(userMemory, gameTypeHint, recentGameDescriptions)

    try {
      let response: Response

      // 优先使用 Vercel Function 代理（隐藏 API Key）
      if (isVercelEnv && !settings.value.apiKey) {
        response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, model: settings.value.model }),
        })
      } else if (settings.value.apiKey) {
        // 用户配置了自己的 API Key，直连
        response = await fetch(`${settings.value.baseUrl}/chat/completions`, {
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
      } else {
        throw new Error('请先配置 API Key')
      }

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`API 请求失败: ${response.status} ${error}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let rawBuffer = ''
      let fullText = ''
      let reasoningText = ''
      let usageData: { completion_tokens: number; tokens_per_second: number } | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        rawBuffer += chunk

        fullText = extractContentFromBuffer(rawBuffer)
        reasoningText = extractReasoningFromBuffer(rawBuffer)
        usageData = extractUsageFromBuffer(rawBuffer)

        // 有内容就显示内容，否则显示思考过程
        const displayText = fullText || reasoningText
        // 使用 usage 中的真实 token 数，没有则用字符数估算
        tokenCount.value = usageData?.completion_tokens || Math.round(fullText.length / 3)
        currentProgress.value = displayText
        onProgress?.(displayText)
      }

      // 最终提取
      fullText = extractContentFromBuffer(rawBuffer)
      usageData = extractUsageFromBuffer(rawBuffer)

      const html = extractHtmlFromResponse(fullText)
      const elapsed = Date.now() - startTime.value

      // token 数用 API 返回的真实值，速度按本地时间计算
      const finalTokenCount = usageData?.completion_tokens || Math.round(fullText.length / 3)
      const finalTokenSpeed = Math.round((finalTokenCount / elapsed) * 1000)

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
        tokenCount: finalTokenCount,
        tokenSpeed: finalTokenSpeed,
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
    if (!settings.value.apiKey && !isVercelEnv) {
      return { success: false, message: '请先填写 API Key' }
    }

    try {
      // Vercel 环境下用代理测试
      if (isVercelEnv && !settings.value.apiKey) {
        const resp = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: '输出ok', model: settings.value.model }),
        })
        if (resp.ok) return { success: true, message: '连接成功！' }
        return { success: false, message: `连接失败: ${resp.status}` }
      }

      const response = await fetch(`${settings.value.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${settings.value.apiKey}` },
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
