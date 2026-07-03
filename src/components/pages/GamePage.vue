<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useGameManager } from '../../composables/useGameManager'
import { useUserMemory } from '../../composables/useUserMemory'
import { useSettings } from '../../composables/useSettings'
import GameSwiper from '../GameSwiper.vue'
import OnboardingModal from '../OnboardingModal.vue'

const { isInitialized, initializeGames } = useGameManager()
const { memory, completeOnboarding } = useUserMemory()
const { settings, canGenerate } = useSettings()

// 每次进入游戏页面时检查是否需要初始化
function checkAndInit() {
  if (!memory.value.isFirstVisit && !isInitialized.value) {
    initializeGames()
  }
}

onMounted(checkAndInit)

watch(() => settings.value.apiKey, () => {
  checkAndInit()
})

function handleOnboardingComplete() {
  completeOnboarding()
  initializeGames()
}
</script>

<template>
  <div class="game-page">
    <OnboardingModal
      v-if="memory.isFirstVisit"
      @complete="handleOnboardingComplete"
    />
    
    <!-- 未配置 API Key 时的提示横幅（Vercel 代理可用时不显示） -->
    <div v-if="!canGenerate()" class="api-hint-banner">
      <span>未配置 API Key，仅显示预置游戏</span>
      <span class="hint-emoji">⚙️</span>
    </div>
    
    <GameSwiper />
  </div>
</template>

<style scoped>
.game-page {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

.api-hint-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(245, 158, 11, 0.15);
  border-bottom: 1px solid rgba(245, 158, 11, 0.3);
  color: #f59e0b;
  font-size: 13px;
  flex-shrink: 0;
}

.hint-emoji {
  font-size: 14px;
}
</style>
