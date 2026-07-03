import { ref, watch } from 'vue'
import type { Settings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

const SETTINGS_KEY = 'sg_settings'

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // 如果 localStorage 中没有 apiKey 但环境变量有，使用环境变量
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        apiKey: parsed.apiKey || DEFAULT_SETTINGS.apiKey,
      }
    }
  } catch {
    // Ignore parse errors
  }
  return { ...DEFAULT_SETTINGS }
}

const settings = ref<Settings>(loadSettings())

export function useSettings() {
  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
  }

  function updateSettings(partial: Partial<Settings>) {
    Object.assign(settings.value, partial)
    saveSettings()
  }

  function resetSettings() {
    settings.value = { ...DEFAULT_SETTINGS }
    saveSettings()
  }

  function hasApiKey(): boolean {
    return !!settings.value.apiKey
  }

  // 是否有可用的 API（用户自带 Key 或 Vercel 代理可用）
  function canGenerate(): boolean {
    if (settings.value.apiKey) return true
    if (typeof window !== 'undefined') {
      return window.location.hostname.includes('vercel.app')
        || window.location.hostname.includes('feedscription.com')
    }
    return false
  }

  // Auto-save on change
  watch(settings, saveSettings, { deep: true })

  return {
    settings,
    updateSettings,
    resetSettings,
    hasApiKey,
    canGenerate,
  }
}
