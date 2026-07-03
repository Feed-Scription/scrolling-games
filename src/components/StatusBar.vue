<script setup lang="ts">
import { computed } from 'vue'
import { useGameManager } from '../composables/useGameManager'
import { useGameStore } from '../stores/gameStore'
import { useSettings } from '../composables/useSettings'

const { isGenerating } = useGameManager()
const { gameState, getGameCount } = useGameStore()
const { settings } = useSettings()

const isAtMax = computed(() => {
  const readyCount = gameState.games.filter(g => g.status === 'ready').length
  return readyCount >= settings.value.maxTotal && !isGenerating.value
})
</script>

<template>
  <div class="status-bar">
    <div class="status-item">
      <span class="label">游戏</span>
      <span class="value">{{ gameState.currentIndex + 1 }}/{{ getGameCount() }}</span>
    </div>
    <div v-if="isGenerating" class="status-item generating">
      <span class="pulse"></span>
      <span class="label">生成中</span>
    </div>
  </div>
  <!-- 达到上限提示 -->
  <div v-if="isAtMax" class="max-hint">
    已达最大游戏数量（{{ settings.maxTotal }}），可在设置中调整
  </div>
</template>

<style scoped>
.status-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent);
  color: white;
  font-size: 14px;
  pointer-events: none;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.label {
  opacity: 0.7;
}

.value {
  font-weight: 600;
}

.generating {
  display: flex;
  align-items: center;
}

.pulse {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.max-hint {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  padding: 8px 16px;
  background: rgba(245, 158, 11, 0.9);
  color: #000;
  font-size: 12px;
  font-weight: 500;
  border-radius: 20px;
  white-space: nowrap;
  pointer-events: none;
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
