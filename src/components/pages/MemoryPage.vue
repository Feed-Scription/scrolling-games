<script setup lang="ts">
import { useUserMemory } from '../../composables/useUserMemory'
import { GAME_TAGS } from '../../types'

const { memory, resetMemory, setSelectedTags } = useUserMemory()

function toggleTag(tag: string) {
  const index = memory.value.selectedTags.indexOf(tag)
  const newTags = [...memory.value.selectedTags]
  if (index === -1) {
    newTags.push(tag)
  } else {
    newTags.splice(index, 1)
  }
  setSelectedTags(newTags)
}

function handleReset() {
  if (confirm('确定要重置所有记忆数据吗？此操作不可恢复。')) {
    resetMemory()
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}分${secs}秒`
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="memory-page">
    <div class="page-header">
      <h1>我的记忆</h1>
      <p class="subtitle">AI会根据你的偏好推荐游戏</p>
    </div>

    <!-- Selected Tags -->
    <section class="section">
      <h2>兴趣标签</h2>
      <div class="tags-grid">
        <button
          v-for="tag in GAME_TAGS"
          :key="tag"
          class="tag"
          :class="{ selected: memory.selectedTags.includes(tag) }"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </section>

    <!-- Inferred Preferences -->
    <section v-if="memory.inferredPreferences" class="section">
      <h2>AI推断的偏好</h2>
      <div class="preferences-card">
        <p>{{ memory.inferredPreferences }}</p>
        <span class="updated-time">
          更新于 {{ formatDate(memory.lastUpdated) }}
        </span>
      </div>
    </section>

    <!-- Game History -->
    <section class="section">
      <h2>游玩记录 ({{ memory.gameHistory.length }})</h2>
      <div v-if="memory.gameHistory.length === 0" class="empty-state">
        还没有游玩记录，快去玩游戏吧！
      </div>
      <div v-else class="history-list">
        <div
          v-for="item in [...memory.gameHistory].reverse()"
          :key="item.timestamp"
          class="history-item"
        >
          <div class="history-info">
            <span class="game-type">{{ item.gameType }}</span>
            <span class="play-time">{{ formatDate(item.timestamp) }}</span>
          </div>
          <div class="history-meta">
            <span class="duration">游玩 {{ formatDuration(item.playDuration) }}</span>
            <span v-if="item.liked" class="liked">喜欢</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Reset Button -->
    <div class="footer">
      <button class="btn-reset" @click="handleReset">
        重置所有记忆
      </button>
    </div>
  </div>
</template>

<style scoped>
.memory-page {
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

.section {
  margin-bottom: 24px;
}

.section h2 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #e2e8f0;
}

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 8px 14px;
  border-radius: 16px;
  background: #252542;
  border: 1px solid transparent;
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag.selected {
  background: rgba(99, 102, 241, 0.2);
  border-color: #6366f1;
  color: #6366f1;
}

.preferences-card {
  background: #252542;
  border-radius: 12px;
  padding: 16px;
}

.preferences-card p {
  font-size: 14px;
  line-height: 1.6;
  color: #e2e8f0;
}

.updated-time {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #64748b;
  font-size: 14px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  background: #252542;
  border-radius: 10px;
  padding: 12px 14px;
}

.history-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.game-type {
  font-size: 14px;
  color: #e2e8f0;
}

.play-time {
  font-size: 12px;
  color: #64748b;
}

.history-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #94a3b8;
}

.liked {
  color: #10b981;
}

.footer {
  margin-top: 32px;
  padding-bottom: 20px;
}

.btn-reset {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: rgba(239, 68, 68, 0.25);
}
</style>
