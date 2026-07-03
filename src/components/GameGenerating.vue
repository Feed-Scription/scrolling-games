<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import type { Game } from '../types'

const props = defineProps<{
  game: Game
}>()

const codeRef = ref<HTMLPreElement | null>(null)
const currentTokenCount = computed(() => props.game.rawText?.length || 0)
const startTime = ref(props.game.generatedAt || Date.now())
const liveSpeed = ref(0)

let timer: ReturnType<typeof setInterval> | null = null

watch(() => props.game.rawText, () => {
  if (!timer) {
    startTime.value = Date.now()
    timer = setInterval(() => {
      const elapsed = (Date.now() - startTime.value) / 1000
      if (elapsed > 0 && currentTokenCount.value > 0) {
        liveSpeed.value = Math.round(currentTokenCount.value / elapsed)
      }
    }, 200)
  }
  // 始终滚动到底部（tail -f 效果）
  nextTick(() => {
    if (codeRef.value) {
      codeRef.value.scrollTop = codeRef.value.scrollHeight
    }
  })
}, { immediate: true })

const displayText = computed(() => {
  if (!props.game.rawText) return '等待生成...'
  return props.game.rawText
})

const hasContent = computed(() => !!props.game.rawText)
</script>

<template>
  <div class="generating">
    <!-- 代码流铺满整个区域 -->
    <div v-if="!hasContent" class="waiting">
      <div class="spinner"></div>
      <p class="waiting-text">正在生成游戏...</p>
    </div>
    <pre v-else ref="codeRef" class="code-preview">{{ displayText }}</pre>

    <!-- 底部状态栏 - 固定在导航栏上方 -->
    <div class="bottom-bar">
      <div class="bar-left">
        <span class="dot"></span>
        <span>实时生成中</span>
      </div>
      <div class="speed-badge">
        <span class="speed-value">{{ liveSpeed }}</span>
        <span class="speed-unit">tokens/s</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.generating {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0a0a14;
  color: #e2e8f0;
  overflow: hidden;
}

.waiting {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.waiting-text {
  font-size: 16px;
  opacity: 0.8;
}

.code-preview {
  flex: 1;
  padding: 12px;
  margin: 0;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 11px;
  line-height: 1.45;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  white-space: pre-wrap;
  word-break: break-all;
  color: #64748b;
  background: transparent;
}

.bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.6);
  border-top: 1px solid rgba(99, 102, 241, 0.2);
  flex-shrink: 0;
  z-index: 1;
}

.bar-left {
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
</style>
