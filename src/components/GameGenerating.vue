<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Game } from '../types'

const props = defineProps<{
  game: Game
}>()

// 实时计算 token 速度
const currentTokenCount = computed(() => props.game.rawText?.length || 0)
const startTime = ref(props.game.generatedAt || Date.now())
const elapsedSec = ref(0)
const liveSpeed = ref(0)

let timer: ReturnType<typeof setInterval> | null = null

watch(() => props.game.rawText, () => {
  if (!timer) {
    startTime.value = Date.now()
    timer = setInterval(() => {
      elapsedSec.value = (Date.now() - startTime.value) / 1000
      if (elapsedSec.value > 0 && currentTokenCount.value > 0) {
        liveSpeed.value = Math.round(currentTokenCount.value / elapsedSec.value)
      }
    }, 200)
  }
}, { immediate: true })

const displayText = computed(() => {
  if (!props.game.rawText) return '等待生成...'
  return props.game.rawText.slice(-500)
})

const hasContent = computed(() => !!props.game.rawText)
</script>

<template>
  <div class="generating">
    <div v-if="!hasContent" class="waiting">
      <div class="spinner"></div>
      <p class="waiting-text">正在生成游戏...</p>
    </div>
    <div v-else class="streaming">
      <div class="header">
        <div class="header-left">
          <span class="dot"></span>
          <span>实时生成中</span>
        </div>
        <div class="speed-badge">
          <span class="speed-value">{{ liveSpeed }}</span>
          <span class="speed-unit">tokens/s</span>
        </div>
      </div>
      <pre class="code-preview">{{ displayText }}</pre>
    </div>
  </div>
</template>

<style scoped>
.generating {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  color: #e2e8f0;
}

.waiting {
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.waiting-text {
  font-size: 16px;
  opacity: 0.8;
}

.streaming {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #10b981;
}

.dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.speed-badge {
  display: flex;
  align-items: baseline;
  gap: 4px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  padding: 4px 10px;
}

.speed-value {
  font-size: 18px;
  font-weight: 700;
  color: #818cf8;
  font-variant-numeric: tabular-nums;
}

.speed-unit {
  font-size: 11px;
  color: #6366f1;
}

.code-preview {
  flex: 1;
  padding: 14px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 11px;
  line-height: 1.5;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  color: #64748b;
}
</style>
