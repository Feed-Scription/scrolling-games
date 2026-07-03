<script setup lang="ts">
import { ref } from 'vue'
import { GAME_TAGS } from '../types'
import { useUserMemory } from '../composables/useUserMemory'

const emit = defineEmits<{
  (e: 'complete'): void
}>()

const { setSelectedTags } = useUserMemory()
const selectedTags = ref<string[]>([])

function toggleTag(tag: string) {
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

function handleComplete() {
  setSelectedTags(selectedTags.value)
  emit('complete')
}

function handleSkip() {
  setSelectedTags([])
  emit('complete')
}
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <div class="header">
        <h2>欢迎来到 AI游戏世界</h2>
        <p class="subtitle">选择你感兴趣的游戏类型，AI会为你推荐更合适的游戏</p>
      </div>

      <div class="tags-grid">
        <button
          v-for="tag in GAME_TAGS"
          :key="tag"
          class="tag"
          :class="{ selected: selectedTags.includes(tag) }"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </button>
      </div>

      <div class="footer">
        <button class="btn-primary" @click="handleComplete">
          开始体验 ({{ selectedTags.length }}个已选)
        </button>
        <button class="btn-skip" @click="handleSkip">
          跳过，直接开始
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(8px);
}

.modal {
  background: #1a1a2e;
  border-radius: 24px;
  padding: 32px 24px;
  max-width: 360px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.header h2 {
  font-size: 22px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.5;
}

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
}

.tag {
  padding: 8px 16px;
  border-radius: 20px;
  background: #252542;
  border: 2px solid transparent;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag:hover {
  border-color: #6366f1;
  color: #e2e8f0;
}

.tag.selected {
  background: rgba(99, 102, 241, 0.2);
  border-color: #6366f1;
  color: #6366f1;
}

.footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-skip {
  background: none;
  border: none;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  padding: 8px;
}

.btn-skip:hover {
  color: #94a3b8;
}
</style>
