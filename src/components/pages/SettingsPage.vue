<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useSettings } from '../../composables/useSettings'
import { useGameGenerator } from '../../composables/useGameGenerator'
import { useGameManager } from '../../composables/useGameManager'
import { useUserMemory } from '../../composables/useUserMemory'

const { settings, updateSettings } = useSettings()
const { testConnection } = useGameGenerator()
const { resetAll } = useGameManager()
const { memory } = useUserMemory()

const showApiKey = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)
const isTesting = ref(false)
const isSaved = ref(false)

const editForm = reactive({
  model: settings.value.model,
  baseUrl: settings.value.baseUrl,
  apiKey: settings.value.apiKey,
  maxConcurrent: settings.value.maxConcurrent,
  maxUnplayed: settings.value.maxUnplayed,
  maxTotal: settings.value.maxTotal,
})

const hasChanges = ref(false)

function onInputChange() {
  hasChanges.value = true
  isSaved.value = false
}

function handleSave() {
  updateSettings({
    model: editForm.model,
    baseUrl: editForm.baseUrl,
    apiKey: editForm.apiKey,
    maxConcurrent: Number(editForm.maxConcurrent) || 1,
    maxUnplayed: Number(editForm.maxUnplayed) || 5,
    maxTotal: Number(editForm.maxTotal) || 50,
  })
  hasChanges.value = false
  isSaved.value = true
  setTimeout(() => { isSaved.value = false }, 2000)
}

async function handleTestConnection() {
  isTesting.value = true
  testResult.value = null
  try {
    testResult.value = await testConnection()
  } catch (error) {
    testResult.value = { success: false, message: `测试失败: ${error}` }
  } finally {
    isTesting.value = false
  }
}

function handleReset() {
  if (!confirm('确定要重置吗？这将清除所有已生成的游戏和记忆数据，保留预置游戏和API设置。')) return
  resetAll()
  // 同时重置用户记忆
  memory.value = {
    selectedTags: [],
    gameHistory: [],
    inferredPreferences: '',
    lastUpdated: Date.now(),
    isFirstVisit: true,
  }
}
</script>

<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>设置</h1>
      <p class="subtitle">配置AI模型连接</p>
    </div>

    <!-- API 配置 -->
    <div class="section-title">API 配置</div>

    <div class="form-group">
      <label class="label">模型名称</label>
      <input
        type="text"
        class="input"
        v-model="editForm.model"
        @input="onInputChange"
        placeholder="例如: xiaomi/mimo-v2.5-pro-ultraspeed"
      />
    </div>

    <div class="form-group">
      <label class="label">Base URL</label>
      <input
        type="text"
        class="input"
        v-model="editForm.baseUrl"
        @input="onInputChange"
        placeholder="例如: https://api.xiaomimimo.com/v1"
      />
      <span class="hint">OpenAI 兼容的 API 地址</span>
    </div>

    <div class="form-group">
      <label class="label">API Key</label>
      <div class="input-group">
        <input
          :type="showApiKey ? 'text' : 'password'"
          class="input"
          v-model="editForm.apiKey"
          @input="onInputChange"
          placeholder="输入你的 API Key"
        />
        <button class="btn-toggle" @click="showApiKey = !showApiKey">
          {{ showApiKey ? '隐藏' : '显示' }}
        </button>
      </div>
      <div class="warning">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        </svg>
        <span>API Key 仅存储在本地浏览器中</span>
      </div>
    </div>

    <!-- 生成策略 -->
    <div class="section-title">生成策略</div>

    <div class="form-row">
      <div class="form-group form-col">
        <label class="label">最大同时生成数</label>
        <input
          type="number"
          class="input"
          v-model.number="editForm.maxConcurrent"
          @input="onInputChange"
          min="1"
          max="5"
        />
        <span class="hint">同时进行的生成任务数</span>
      </div>
      <div class="form-group form-col">
        <label class="label">最大未玩游戏数</label>
        <input
          type="number"
          class="input"
          v-model.number="editForm.maxUnplayed"
          @input="onInputChange"
          min="1"
          max="20"
        />
        <span class="hint">缓存池大小</span>
      </div>
    </div>

    <div class="form-group">
      <label class="label">最大总游戏数</label>
      <input
        type="number"
        class="input"
        v-model.number="editForm.maxTotal"
        @input="onInputChange"
        min="5"
        max="200"
      />
      <span class="hint">达到上限后停止生成新游戏</span>
    </div>

    <!-- 保存按钮 -->
    <div class="save-section">
      <button
        class="btn-save"
        :class="{ 'btn-save-changes': hasChanges, 'btn-save-saved': isSaved }"
        @click="handleSave"
      >
        {{ isSaved ? '已保存 ✓' : '保存设置' }}
      </button>
      <p v-if="hasChanges && !isSaved" class="save-hint">有未保存的修改</p>
    </div>

    <div class="test-section">
      <button
        class="btn-test"
        :disabled="isTesting || !editForm.apiKey"
        @click="handleTestConnection"
      >
        {{ isTesting ? '测试中...' : '测试连接' }}
      </button>
      <div
        v-if="testResult"
        class="test-result"
        :class="{ success: testResult.success, error: !testResult.success }"
      >
        {{ testResult.message }}
      </div>
    </div>

    <!-- 重置 -->
    <div class="section-title">数据管理</div>

    <div class="reset-section">
      <button class="btn-reset" @click="handleReset">
        重置所有数据
      </button>
      <span class="hint">清除已生成的游戏和记忆，保留预置游戏和API设置</span>
    </div>

    <div class="info-section">
      <h3>关于</h3>
      <p>Scrolling Games - AI游戏版抖音</p>
      <p>所有游戏均由 AI 实时生成</p>
      <a class="github-link" href="https://github.com/Feed-Scription/scrolling-games" target="_blank" rel="noopener">
        GitHub 开源仓库
      </a>
      <a class="github-link" href="https://wortou.ai" target="_blank" rel="noopener">
        https://wortou.ai
      </a>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  padding-top: max(20px, env(safe-area-inset-top));
  padding-bottom: max(20px, env(safe-area-inset-bottom));
}

.page-header { text-align: center; margin-bottom: 24px; }
.page-header h1 {
  font-size: 24px; margin-bottom: 4px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.subtitle { font-size: 14px; color: #64748b; }

.section-title {
  font-size: 13px; font-weight: 600; color: #818cf8;
  text-transform: uppercase; letter-spacing: 1px;
  margin: 24px 0 12px; padding-bottom: 6px;
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
}

.form-group { margin-bottom: 16px; }
.form-row { display: flex; gap: 12px; }
.form-col { flex: 1; }

.label { display: block; font-size: 13px; font-weight: 600; color: #e2e8f0; margin-bottom: 6px; }

.input {
  width: 100%; padding: 10px 12px; border-radius: 8px;
  background: #252542; border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0; font-size: 14px; outline: none;
  transition: border-color 0.2s;
}
.input:focus { border-color: #6366f1; }
.input::placeholder { color: #64748b; }

.input-group { display: flex; gap: 8px; }
.input-group .input { flex: 1; }

.btn-toggle {
  padding: 10px 14px; border-radius: 8px;
  background: #252542; border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8; font-size: 13px; cursor: pointer; white-space: nowrap;
}

.hint { display: block; margin-top: 4px; font-size: 11px; color: #64748b; }

.warning {
  display: flex; align-items: flex-start; gap: 8px;
  margin-top: 8px; padding: 8px 10px; border-radius: 6px;
  background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2);
  color: #f59e0b; font-size: 11px; line-height: 1.5;
}
.warning svg { flex-shrink: 0; margin-top: 1px; }

.save-section { margin-top: 20px; }
.btn-save {
  width: 100%; padding: 12px; border-radius: 10px;
  background: #374151; border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0; font-size: 15px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.btn-save-changes {
  background: linear-gradient(135deg, #6366f1, #8b5cf6); border-color: transparent;
  animation: pulse-glow 2s infinite;
}
.btn-save-saved {
  background: linear-gradient(135deg, #10b981, #059669); border-color: transparent;
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
}
.btn-save:active { transform: scale(0.98); }
.save-hint { margin-top: 6px; font-size: 12px; color: #f59e0b; text-align: center; }

.test-section { margin-top: 12px; }
.btn-test {
  width: 100%; padding: 10px; border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none;
  color: white; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-test:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-test:not(:disabled):active { transform: scale(0.98); }
.test-result {
  margin-top: 10px; padding: 10px; border-radius: 8px;
  font-size: 13px; text-align: center;
}
.test-result.success {
  background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981;
}
.test-result.error {
  background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444;
}

.reset-section {
  margin-bottom: 16px;
}
.btn-reset {
  width: 100%; padding: 12px; border-radius: 10px;
  background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171; font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.2s; margin-bottom: 6px;
}
.btn-reset:active { transform: scale(0.98); background: rgba(239, 68, 68, 0.2); }

.info-section {
  margin-top: 32px; padding: 16px; background: #252542;
  border-radius: 12px; text-align: center;
}
.info-section h3 { font-size: 15px; color: #e2e8f0; margin-bottom: 8px; }
.info-section p { font-size: 12px; color: #64748b; margin-bottom: 2px; }
.github-link {
  display: inline-block; margin-top: 8px; font-size: 12px;
  color: #818cf8; text-decoration: none;
}
.github-link:hover { text-decoration: underline; }
</style>
