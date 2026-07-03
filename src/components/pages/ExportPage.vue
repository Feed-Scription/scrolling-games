<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { exportGamesAsZip } from '../../utils/exportZip'

const { gameState, getGameCount } = useGameStore()

const readyGames = computed(() => {
  return gameState.games.filter(g => g.status === 'ready')
})

async function handleExport() {
  if (readyGames.value.length === 0) return
  
  try {
    await exportGamesAsZip(readyGames.value)
  } catch (error) {
    alert(`导出失败: ${error}`)
  }
}
</script>

<template>
  <div class="export-page">
    <div class="page-header">
      <h1>导出游戏</h1>
      <p class="subtitle">将所有生成的游戏打包下载</p>
    </div>

    <div class="stats">
      <div class="stat-item">
        <span class="stat-value">{{ getGameCount() }}</span>
        <span class="stat-label">已生成游戏</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ readyGames.length }}</span>
        <span class="stat-label">可导出游戏</span>
      </div>
    </div>

    <button
      class="btn-export"
      :disabled="readyGames.length === 0"
      @click="handleExport"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
      </svg>
      导出为 ZIP 文件
    </button>

    <div v-if="readyGames.length > 0" class="games-list">
      <h2>游戏列表</h2>
      <div
        v-for="(game, index) in readyGames"
        :key="game.id"
        class="game-item"
      >
        <div class="game-index">{{ index + 1 }}</div>
        <div class="game-info">
          <span class="game-title">{{ game.title || '未命名游戏' }}</span>
          <span class="game-meta">
            生成耗时 {{ (game.generationTime / 1000).toFixed(1) }}s
            | {{ game.tokenSpeed }} tokens/s
          </span>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>还没有生成任何游戏</p>
      <p class="hint">去游戏页面滑动体验，游戏会自动生成</p>
    </div>
  </div>
</template>

<style scoped>
.export-page {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  padding-top: max(20px, env(safe-area-inset-top));
  padding-bottom: max(20px, env(safe-area-inset-bottom));
}

.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  margin-bottom: 4px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
}

.stats {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  flex: 1;
  padding: 16px;
  background: #252542;
  border-radius: 12px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #6366f1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
}

.btn-export {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-export:not(:disabled):active {
  transform: scale(0.98);
}

.games-list {
  margin-top: 32px;
}

.games-list h2 {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 12px;
}

.game-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #252542;
  border-radius: 10px;
  margin-bottom: 8px;
}

.game-index {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.2);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #6366f1;
}

.game-info {
  flex: 1;
  min-width: 0;
}

.game-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #e2e8f0;
}

.game-meta {
  font-size: 11px;
  color: #64748b;
}

.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: #64748b;
}

.empty-state p {
  margin-bottom: 8px;
}

.hint {
  font-size: 13px;
  opacity: 0.7;
}
</style>
