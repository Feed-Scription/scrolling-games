<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Page } from './types'
import { useGameManager } from './composables/useGameManager'
import GamePage from './components/pages/GamePage.vue'
import MemoryPage from './components/pages/MemoryPage.vue'
import SettingsPage from './components/pages/SettingsPage.vue'
import ExportPage from './components/pages/ExportPage.vue'
import BottomNav from './components/BottomNav.vue'

const currentPage = ref<Page>('game')
const { gameState, goToNext, goToPrev } = useGameManager()

const canGoPrev = computed(() => gameState.currentIndex > 0)
const canGoNext = computed(() => {
  // 当前游戏正在生成时，不允许继续往下
  const currentGame = gameState.games[gameState.currentIndex]
  if (currentGame && currentGame.status === 'generating') return false
  
  const nextIndex = gameState.currentIndex + 1
  if (nextIndex >= gameState.games.length) return false
  const nextGame = gameState.games[nextIndex]
  return nextGame && (nextGame.status === 'ready' || nextGame.status === 'generating')
})

function handleNavigate(page: Page) {
  currentPage.value = page
}

function handleGamePrev() {
  goToPrev()
}

function handleGameNext() {
  goToNext()
}
</script>

<template>
  <div class="app">
    <main class="content">
      <GamePage v-if="currentPage === 'game'" />
      <MemoryPage v-else-if="currentPage === 'memory'" />
      <SettingsPage v-else-if="currentPage === 'settings'" />
      <ExportPage v-else-if="currentPage === 'export'" />
    </main>
    <BottomNav
      :current-page="currentPage"
      :can-go-prev="canGoPrev"
      :can-go-next="canGoNext"
      @navigate="handleNavigate"
      @game-prev="handleGamePrev"
      @game-next="handleGameNext"
    />
  </div>
</template>

<style scoped>
.app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0f0f1a;
}

.content {
  flex: 1;
  overflow: hidden;
  position: relative;
}
</style>
