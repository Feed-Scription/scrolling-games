<script setup lang="ts">
import type { Page } from '../types'

const props = defineProps<{
  currentPage: Page
  canGoPrev: boolean
  canGoNext: boolean
}>()

const emit = defineEmits<{
  (e: 'navigate', page: Page): void
  (e: 'game-prev'): void
  (e: 'game-next'): void
}>()

const tabs: { id: Page; icon: string; label: string }[] = [
  { id: 'game', icon: '🎮', label: '游戏' },
  { id: 'memory', icon: '📝', label: '记忆' },
  { id: 'settings', icon: '⚙️', label: '设置' },
  { id: 'export', icon: '📦', label: '导出' },
]
</script>

<template>
  <nav class="bottom-nav">
    <!-- 左侧 tab 按钮 -->
    <div class="nav-tabs">
      <button
        v-for="tab in tabs.slice(0, 2)"
        :key="tab.id"
        class="nav-item"
        :class="{ active: currentPage === tab.id }"
        @click="emit('navigate', tab.id)"
      >
        <span class="nav-icon">{{ tab.icon }}</span>
        <span class="nav-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- 中间切换按钮 -->
    <div class="nav-switcher">
      <button
        class="switch-btn"
        :disabled="!canGoPrev"
        @click="emit('game-prev')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
      </button>
      <button
        class="switch-btn"
        :disabled="!canGoNext"
        @click="emit('game-next')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
    </div>

    <!-- 右侧 tab 按钮 -->
    <div class="nav-tabs">
      <button
        v-for="tab in tabs.slice(2)"
        :key="tab.id"
        class="nav-item"
        :class="{ active: currentPage === tab.id }"
        @click="emit('navigate', tab.id)"
      >
        <span class="nav-icon">{{ tab.icon }}</span>
        <span class="nav-label">{{ tab.label }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.bottom-nav {
  display: flex;
  align-items: center;
  background: #1a1a2e;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 6px 0;
  padding-bottom: max(6px, env(safe-area-inset-bottom));
}

.nav-tabs {
  display: flex;
  justify-content: space-around;
  flex: 1;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-item.active {
  color: #6366f1;
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-icon {
  font-size: 18px;
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
}

.nav-switcher {
  display: flex;
  gap: 4px;
  padding: 0 8px;
}

.switch-btn {
  width: 40px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 10px;
  color: #818cf8;
  cursor: pointer;
  transition: all 0.15s ease;
}

.switch-btn:active:not(:disabled) {
  transform: scale(0.9);
  background: rgba(99, 102, 241, 0.3);
}

.switch-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}
</style>
