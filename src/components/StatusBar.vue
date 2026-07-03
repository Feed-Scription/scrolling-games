<script setup lang="ts">
import { useGameManager } from '../composables/useGameManager'
import { useGameStore } from '../stores/gameStore'

const { isGenerating } = useGameManager()
const { gameState, getGameCount } = useGameStore()
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
</style>
