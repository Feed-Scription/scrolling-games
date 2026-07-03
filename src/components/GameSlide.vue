<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Game } from '../types'

const props = defineProps<{
  game: Game
  isActive: boolean
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)

// Reload iframe when game changes
watch(() => props.game.html, () => {
  if (iframeRef.value && props.game.html) {
    iframeRef.value.srcdoc = props.game.html
  }
})
</script>

<template>
  <div class="game-slide">
    <iframe
      v-if="game.status === 'ready' && game.html"
      ref="iframeRef"
      :srcdoc="game.html"
      class="game-iframe"
      sandbox="allow-scripts allow-same-origin allow-pointer-lock"
      scrolling="no"
    />
  </div>
</template>

<style scoped>
.game-slide {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.game-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #000;
}
</style>
