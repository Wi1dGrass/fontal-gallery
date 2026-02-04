<template>
  <div class="upload-studio-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">
        <Upload class="title-icon" />
        Upload Studio
      </h1>
      <button class="back-btn" @click="$router.push('/')">
        <X class="close-icon" />
      </button>
    </div>

    <!-- 主内容区 -->
    <div class="studio-content">
      <!-- 左侧：上传区域和队列 -->
      <div class="main-section">
        <!-- 空间选择 -->
        <SpaceSelector
          v-model="selectedSpace"
          :personal-space="personalSpace"
          @create-space="showCreateSpace = true"
        />

        <!-- 上传区域 -->
        <div class="upload-section">
          <div
            class="drop-zone"
            :class="{ 'dragging': isDragging, 'uploading': isUploading }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              multiple
              class="hidden-input"
              @change="handleFileSelect"
            >

            <div v-if="!isUploading" class="upload-prompt">
              <div class="upload-icon-wrapper">
                <UploadCloud class="upload-icon" />
                <div class="upload-glow"></div>
              </div>
              <h3 class="upload-heading">拖拽图片到此处</h3>
              <p class="upload-subheading">或点击选择文件，支持批量上传</p>
            </div>

            <div v-else class="upload-progress">
              <div class="progress-circle">
                <svg viewBox="0 0 100 100" class="progress-svg">
                  <circle
                    class="progress-bg"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    stroke-width="6"
                  />
                  <circle
                    class="progress-fill"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#uploadGradient)"
                    stroke-width="6"
                    :stroke-dasharray="283"
                    :stroke-dashoffset="283 - (283 * uploadProgress) / 100"
                    transform="rotate(-90 50 50)"
                  />
                  <defs>
                    <linearGradient id="uploadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#FF3D00" />
                      <stop offset="100%" stop-color="#FF6B35" />
                    </linearGradient>
                  </defs>
                </svg>
                <span class="progress-text">{{ Math.round(uploadProgress) }}%</span>
              </div>
              <p class="upload-status">上传中...</p>
            </div>
          </div>

          <!-- URL 上传按钮 -->
          <button class="url-upload-btn" @click="showUrlModal = true">
            <Link class="url-icon" />
            URL 上传
          </button>
        </div>

        <!-- 上传队列 -->
        <UploadQueue
          :queue="queue"
          :queue-stats="queueStats"
          @toggle-select="toggleSelect"
          @remove="removeItem"
          @clear="clearQueue"
        />
      </div>

      <!-- 右侧：批量操作 -->
      <div class="sidebar">
        <div class="sidebar-section">
          <h3 class="sidebar-title">批量操作</h3>

          <div class="batch-actions">
            <button class="batch-btn" @click="toggleSelectAll">
              <Check class="batch-icon" />
              {{ selectedCount === queue.length ? '取消全选' : '全选' }}
            </button>

            <button class="batch-btn" :disabled="selectedCount === 0" @click="showBatchCategory = true">
              <Folder class="batch-icon" />
              批量分类
            </button>

            <button class="batch-btn" :disabled="selectedCount === 0" @click="showBatchTags = true">
              <Tag class="batch-icon" />
              批量标签
            </button>
          </div>
        </div>

        <!-- 上传按钮 -->
        <div class="sidebar-section upload-action">
          <button
            class="upload-submit-btn"
            :disabled="!canUpload"
            @click="handleUploadAll"
          >
            <Loader2 v-if="isUploading" class="submit-icon spin" />
            <Upload v-else class="submit-icon" />
            {{ isUploading ? '上传中...' : `批量上传 (${queueStats.pending + queueStats.error})` }}
          </button>
          <p v-if="selectedSpace" class="upload-hint">
            将上传到: {{ selectedSpace.spaceName }}
          </p>
          <p v-else class="upload-hint">
            将上传到公共空间
          </p>
        </div>
      </div>
    </div>

    <!-- URL 上传模态框 -->
    <Transition name="modal">
      <div v-if="showUrlModal" class="modal-overlay" @click.self="showUrlModal = false">
        <div class="modal">
          <h3 class="modal-title">URL 上传图片</h3>
          <input
            v-model="urlInput"
            type="text"
            class="url-modal-input"
            placeholder="粘贴图片 URL 地址..."
            @keyup.enter="handleUrlUpload"
          />
          <div class="modal-actions">
            <button class="modal-btn btn-cancel" @click="showUrlModal = false">
              取消
            </button>
            <button
              class="modal-btn btn-confirm"
              :disabled="!urlInput.trim()"
              @click="handleUrlUpload"
            >
              添加到队列
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 批量分类模态框 -->
    <Transition name="modal">
      <div v-if="showBatchCategory" class="modal-overlay" @click.self="showBatchCategory = false">
        <div class="modal">
          <h3 class="modal-title">批量设置分类</h3>
          <select v-model="batchCategoryValue" class="modal-select">
            <option value="">选择分类</option>
            <option value="二次元">二次元</option>
            <option value="写实">写实</option>
            <option value="风景">风景</option>
            <option value="人像">人像</option>
            <option value="表情包">表情包</option>
            <option value="壁纸">壁纸</option>
            <option value="素材">素材</option>
            <option value="抽象">抽象</option>
          </select>
          <div class="modal-actions">
            <button class="modal-btn btn-cancel" @click="showBatchCategory = false">
              取消
            </button>
            <button
              class="modal-btn btn-confirm"
              :disabled="!batchCategoryValue"
              @click="applyBatchCategory"
            >
              应用 ({{ selectedCount }}张)
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 批量标签模态框 -->
    <Transition name="modal">
      <div v-if="showBatchTags" class="modal-overlay" @click.self="showBatchTags = false">
        <div class="modal">
          <h3 class="modal-title">批量添加标签</h3>
          <input
            v-model="batchTagsInput"
            type="text"
            class="modal-input"
            placeholder="输入多个标签，用逗号分隔"
          />
          <p class="modal-hint">将添加到 {{ selectedCount }} 张图片</p>
          <div class="modal-actions">
            <button class="modal-btn btn-cancel" @click="showBatchTags = false">
              取消
            </button>
            <button
              class="modal-btn btn-confirm"
              :disabled="!batchTagsInput.trim()"
              @click="applyBatchTags"
            >
              应用
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 创建空间模态框 (复用 PersonalSpace 中的逻辑) -->
    <Transition name="modal">
      <div v-if="showCreateSpace" class="modal-overlay" @click.self="showCreateSpace = false">
        <div class="modal modal-large">
          <h3 class="modal-title">创建个人空间</h3>
          <div class="space-options">
            <div
              class="space-tier-option"
              :class="{ 'selected': newSpaceLevel === 0 }"
              @click="newSpaceLevel = 0"
            >
              <div class="tier-icon">🛡️</div>
              <div class="tier-name">普通版</div>
              <div class="tier-specs">
                <div class="tier-spec">100 MB 存储</div>
                <div class="tier-spec">100 张图片</div>
              </div>
              <div class="tier-price">免费</div>
            </div>
            <div
              class="space-tier-option"
              :class="{ 'selected': newSpaceLevel === 1 }"
              @click="newSpaceLevel = 1"
            >
              <div class="tier-icon">💎</div>
              <div class="tier-name">专业版</div>
              <div class="tier-specs">
                <div class="tier-spec">1000 MB (1 GB) 存储</div>
                <div class="tier-spec">1000 张图片</div>
              </div>
              <div class="tier-price">免费 (测试期)</div>
            </div>
          </div>
          <input
            v-model="newSpaceName"
            type="text"
            class="modal-input"
            placeholder="输入空间名称..."
          />
          <div class="modal-actions">
            <button class="modal-btn btn-cancel" @click="showCreateSpace = false">
              取消
            </button>
            <button
              class="modal-btn btn-confirm"
              :disabled="!newSpaceName.trim() || creatingSpace"
              @click="handleCreateSpace"
            >
              <Loader2 v-if="creatingSpace" class="spin" />
              {{ creatingSpace ? '创建中...' : '创建空间' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  X, Upload, UploadCloud, Link, Check, Folder, Tag, Loader2
} from 'lucide-vue-next'
import { useUploadQueue } from '@/composables/useUploadQueue.js'
import { createSpace } from '@/config/api.js'
import SpaceSelector from '@/components/upload/SpaceSelector.vue'
import UploadQueue from '@/components/upload/UploadQueue.vue'

const router = useRouter()

// 使用上传队列
const {
  queue,
  selectedSpace,
  personalSpace,
  isUploading,
  uploadProgress,
  queueStats,
  canUpload,
  selectedCount,
  fetchPersonalSpace,
  addFromFiles,
  addFromUrl,
  removeItem,
  clearQueue,
  toggleSelectAll,
  selectSpace,
  uploadAll
} = useUploadQueue()

// 本地状态
const fileInputRef = ref(null)
const isDragging = ref(false)
const showUrlModal = ref(false)
const showBatchCategory = ref(false)
const showBatchTags = ref(false)
const showCreateSpace = ref(false)
const urlInput = ref('')
const batchCategoryValue = ref('')
const batchTagsInput = ref('')
const newSpaceName = ref('')
const newSpaceLevel = ref(0)
const creatingSpace = ref(false)

// 初始化
onMounted(async () => {
  await fetchPersonalSpace()
})

// 触发文件选择
function triggerFileInput() {
  if (isUploading.value) return
  fileInputRef.value?.click()
}

// 处理文件选择
function handleFileSelect(event) {
  const files = event.target.files
  if (files && files.length > 0) {
    addFromFiles(files)
  }
  // 清空输入
  event.target.value = ''
}

// 处理拖放
function handleDrop(event) {
  isDragging.value = false
  if (isUploading.value) return

  const files = Array.from(event.dataTransfer.files)
    .filter(f => f.type.startsWith('image/'))

  if (files.length > 0) {
    addFromFiles(files)
  }
}

// URL 上传
async function handleUrlUpload() {
  const url = urlInput.value.trim()
  if (!url) return

  await addFromUrl(url)
  urlInput.value = ''
  showUrlModal.value = false
}

// 切换选择状态
function toggleSelect(id) {
  const item = queue.value.find(i => i.id === id)
  if (item) {
    item.selected = !item.selected
  }
}

// 批量设置分类
function applyBatchCategory() {
  if (!batchCategoryValue.value) return

  queue.value.forEach(item => {
    if (item.selected) {
      item.category = batchCategoryValue.value
    }
  })

  showBatchCategory.value = false
  batchCategoryValue.value = ''
}

// 批量添加标签
function applyBatchTags() {
  const tags = batchTagsInput.value
    .split(',')
    .map(t => t.trim())
    .filter(t => t)

  if (tags.length === 0) return

  queue.value.forEach(item => {
    if (item.selected) {
      if (!item.tags) item.tags = []
      tags.forEach(tag => {
        if (!item.tags.includes(tag)) {
          item.tags.push(tag)
        }
      })
    }
  })

  showBatchTags.value = false
  batchTagsInput.value = ''
}

// 批量上传
async function handleUploadAll() {
  const result = await uploadAll()
  if (result) {
    // 上传完成
    if (result.fail === 0) {
      alert(`成功上传 ${result.success} 张图片！`)
    } else {
      alert(`上传完成：成功 ${result.success} 张，失败 ${result.fail} 张`)
    }
  }
}

// 创建空间
async function handleCreateSpace() {
  if (!newSpaceName.value.trim()) return

  creatingSpace.value = true
  try {
    const result = await createSpace(newSpaceName.value.trim(), newSpaceLevel.value)
    if (result.code === 0) {
      // 重新加载个人空间
      await fetchPersonalSpace()
      showCreateSpace.value = false
      newSpaceName.value = ''
    } else {
      alert(result.message || '创建空间失败')
    }
  } catch (error) {
    alert('创建空间失败: ' + error.message)
  } finally {
    creatingSpace.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600;700&display=swap');

.upload-studio-page {
  min-height: 100vh;
  padding: 100px 24px 40px;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== 页面头部 ========== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: 'Orbitron', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0;
}

.title-icon {
  width: 28px;
  height: 28px;
  color: #FF3D00;
}

.back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.close-icon {
  width: 20px;
  height: 20px;
}

/* ========== 主内容区 ========== */
.studio-content {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.main-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ========== 上传区域 ========== */
.upload-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drop-zone {
  position: relative;
  padding: 48px 24px;
  background: rgba(13, 13, 18, 0.6);
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.drop-zone:hover {
  border-color: rgba(255, 61, 0, 0.3);
  background: rgba(255, 61, 0, 0.02);
}

.drop-zone.dragging {
  border-color: #FF3D00;
  background: rgba(255, 61, 0, 0.1);
  transform: scale(1.01);
}

.drop-zone.uploading {
  border-style: solid;
  border-color: rgba(255, 61, 0, 0.3);
  pointer-events: none;
}

.upload-prompt {
  position: relative;
}

.upload-icon-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.upload-icon {
  position: relative;
  width: 56px;
  height: 56px;
  color: #FF3D00;
  z-index: 1;
}

.upload-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(255, 61, 0, 0.3), transparent 70%);
  filter: blur(20px);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
}

.upload-heading {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0 0 8px 0;
}

.upload-subheading {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.progress-circle {
  position: relative;
  width: 100px;
  height: 100px;
}

.progress-svg {
  width: 100%;
  height: 100%;
  animation: spin 10s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.upload-status {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.url-upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
}

.url-upload-btn:hover {
  background: rgba(147, 51, 234, 0.1);
  border-color: rgba(147, 51, 234, 0.3);
  color: #e9d5ff;
}

.url-icon {
  width: 16px;
  height: 16px;
}

/* ========== 侧边栏 ========== */
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-section {
  background: rgba(13, 13, 18, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
}

.sidebar-title {
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 16px 0;
}

.batch-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.batch-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.batch-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.batch-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.batch-icon {
  width: 16px;
  height: 16px;
}

.upload-action {
  text-align: center;
}

.upload-submit-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #FF3D00, #FF6B35);
  border: none;
  border-radius: 12px;
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(255, 61, 0, 0.3);
}

.upload-submit-btn:hover:not(:disabled) {
  box-shadow: 0 6px 30px rgba(255, 61, 0, 0.45);
  transform: translateY(-2px);
}

.upload-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.submit-icon {
  width: 18px;
  height: 18px;
}

.submit-icon.spin {
  animation: spin 1s linear infinite;
}

.upload-hint {
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin: 12px 0 0 0;
}

/* ========== 模态框 ========== */
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  z-index: 1000;
  padding: 20px;
}

.modal {
  width: 100%;
  max-width: 400px;
  padding: 24px;
  background: rgba(13, 13, 18, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.modal-large {
  max-width: 500px;
}

.modal-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0 0 20px 0;
}

.modal-input,
.modal-select,
.url-modal-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(10, 10, 10, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: white;
  margin-bottom: 20px;
}

.modal-input:focus,
.modal-select:focus,
.url-modal-input:focus {
  outline: none;
  border-color: #FF3D00;
}

.modal-input::placeholder,
.url-modal-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.modal-hint {
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin: -12px 0 20px 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 12px 24px;
  border-radius: 10px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-confirm {
  background: linear-gradient(135deg, #FF3D00, #FF6B35);
  border: none;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  box-shadow: 0 4px 20px rgba(255, 61, 0, 0.3);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spin {
  animation: spin 1s linear infinite;
}

/* ========== 空间选项 ========== */
.space-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.space-tier-option {
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.space-tier-option:hover {
  background: rgba(255, 255, 255, 0.06);
}

.space-tier-option.selected {
  background: rgba(255, 61, 0, 0.1);
  border-color: #FF3D00;
}

.tier-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.tier-name {
  font-family: 'Exo 2', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: white;
  margin-bottom: 12px;
}

.tier-specs {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.tier-spec {
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.tier-price {
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #22c55e;
}

/* ========== 模态框动画 ========== */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal,
.modal-enter-from .modal-large,
.modal-leave-to .modal-large {
  transform: scale(0.9);
}

/* ========== 隐藏输入 ========== */
.hidden-input {
  display: none;
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .studio-content {
    grid-template-columns: 1fr;
  }

  .sidebar {
    flex-direction: row;
  }

  .sidebar-section {
    flex: 1;
  }
}

@media (max-width: 640px) {
  .sidebar {
    flex-direction: column;
  }

  .space-options {
    grid-template-columns: 1fr;
  }
}
</style>
