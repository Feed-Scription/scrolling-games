<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useGameManager } from '../composables/useGameManager'
import GameSlide from './GameSlide.vue'
import GameGenerating from './GameGenerating.vue'
import StatusBar from './StatusBar.vue'

const { gameState, onGameEnter } = useGameManager()

const containerRef = ref<HTMLElement | null>(null)
const actualHeight = ref(0)

function measureHeight() {
  if (containerRef.value) {
    actualHeight.value = containerRef.value.clientHeight
  }
}

const trackStyle = computed(() => {
  const offset = -gameState.currentIndex * actualHeight.value
  return {
    transform: `translateY(${offset}px)`,
    transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  }
})

onMounted(() => {
  measureHeight()
  onGameEnter()
  window.addEventListener('resize', measureHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', measureHeight)
})

watch(() => gameState.currentIndex, () => {
  onGameEnter()
})
</script>

<template>
  <div ref="containerRef" class="swiper-container">
    <StatusBar />

    <div class="swiper-track" :style="trackStyle">
      <div
        v-for="(game, index) in gameState.games"
        :key="game.id"
        class="swiper-slide"
      >
        <GameSlide
          v-if="game.status === 'ready'"
          :game="game"
          :is-active="index === gameState.currentIndex"
        />
        <GameGenerating
          v-else-if="game.status === 'generating'"
          :game="game"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.swiper-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #0f0f1a;
}

.swiper-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  will-change: transform;
}

.swiper-slide {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
