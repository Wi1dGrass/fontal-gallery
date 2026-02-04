<template>
  <div class="upload-area">
    <!-- 拖拽上传区域 -->
    <div
      class="drop-zone"
      :class="{
        'is-dragging': isDragging,
        'is-uploading': uploading
      }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <!-- 上传中状态 -->
      <div v-if="uploading" class="uploading-state">
        <div class="progress-ring-wrapper">
          <svg class="progress-ring" viewBox="0 0 100 100">
            <circle
              class="progress-ring-bg"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              stroke-width="6"
            />
            <circle
              class="progress-ring-fill"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#uploadProgress)"
              stroke-width="6"
              :stroke-dasharray="283"
              :stroke-dashoffset="283 - (283 * uploadProgress) / 100"
              transform="rotate(-90 50 50)"
            />
            <defs>
              <linearGradient id="uploadProgress" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00F0FF" />
                <stop offset="100%" stop-color="#00C0CC" />
              </linearGradient>
            </defs>
          </svg>
          <span class="progress-text">{{ uploadProgress }}%</span>
        </div>
        <p class="uploading-text">上传中...</p>
      </div>

      <!-- 默认状态 -->
      <template v-else>
        <div class="upload-icon-wrapper">
          <div class="upload-icon-glow"></div>
          <UploadCloud class="upload-icon" />
        </div>
        <p class="upload-title">拖拽图片到此处上传</p>
        <p class="upload-hint">或点击选择文件（支持 JPG、PNG、GIF、WEBP）</p>
      </template>

      <!-- 隐藏的文件输入 -->
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        multiple
        @change="handleFileSelect"
        style="display: none"
      />
    </div>

    <!-- URL 上传按钮 -->
    <button class="url-upload-btn" @click="showUrlModal = true">
      <Link class="url-icon" />
      使用 URL 上传
    </button>

    <!-- URL 上传模态框 -->
    <Transition name="modal">
      <div v-if="showUrlModal" class="url-modal-overlay" @click.self="showUrlModal = false">
        <div class="url-modal">
          <h3 class="modal-title">URL 上传图片</h3>
          <input
            v-model="urlInput"
            type="text"
            class="url-input"
            placeholder="粘贴图片 URL 地址..."
            @keyup.enter="handleUrlUpload"
          />
          <div class="modal-actions">
            <button class="modal-btn btn-cancel" @click="showUrlModal = false">
              取消
            </button>
            <button
              class="modal-btn btn-confirm"
              @click="handleUrlUpload"
              :disabled="!urlInput.trim() || urlUploading"
            >
              <Loader2 v-if="urlUploading" class="spinner" />
              {{ urlUploading ? '上传中...' : '确认上传' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { UploadCloud, Link, Loader2 } from 'lucide-vue-next'
import { uploadPicture, uploadPictureByUrl } from '@/config/api.js'

const props = defineProps({
  spaceId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['uploaded'])

const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const fileInputRef = ref(null)

const showUrlModal = ref(false)
const urlInput = ref('')
const urlUploading = ref(false)

function triggerFileInput() {
  if (uploading.value) return
  fileInputRef.value?.click()
}

function handleDragOver(event) {
  if (uploading.value) return
  isDragging.value = true
}

function handleDragLeave(event) {
  isDragging.value = false
}

async function handleDrop(event) {
  isDragging.value = false
  if (uploading.value) return

  const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'))
  if (files.length > 0) {
    await uploadFiles(files)
  }
}

async function handleFileSelect(event) {
  const files = Array.from(event.target.files || [])
  if (files.length > 0) {
    await uploadFiles(files)
  }
  // 清空输入
  event.target.value = ''
}

async function uploadFiles(files) {
  uploading.value = true
  uploadProgress.value = 0

  try {
    for (let i = 0; i < files.length; i++) {
      // 正确传递 spaceId 作为 options 参数
      await uploadPicture(files[i], { spaceId: props.spaceId })
      uploadProgress.value = ((i + 1) / files.length) * 100
    }
    emit('uploaded')
  } catch (error) {
    console.error('上传失败:', error)
    alert(error.message || '上传失败，请重试')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

async function handleUrlUpload() {
  if (!urlInput.value.trim()) return

  urlUploading.value = true
  try {
    await uploadPictureByUrl(urlInput.value.trim(), { spaceId: props.spaceId })
    emit('uploaded')
    showUrlModal.value = false
    urlInput.value = ''
  } catch (error) {
    console.error('URL 上传失败:', error)
    alert(error.message || '上传失败，请检查 URL 是否正确')
  } finally {
    urlUploading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700&display=swap');

.upload-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ========== 拖拽上传区域 ========== */
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
  border-color: rgba(0, 240, 255, 0.4);
  background: rgba(0, 240, 255, 0.02);
}

.drop-zone.is-dragging {
  border-color: #00F0FF;
  background: rgba(0, 240, 255, 0.1);
  transform: scale(1.02);
}

.drop-zone.is-uploading {
  cursor: wait;
}

/* 上传图标 */
.upload-icon-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.upload-icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(0, 240, 255, 0.3), transparent 70%);
  filter: blur(20px);
}

.upload-icon {
  position: relative;
  width: 48px;
  height: 48px;
  color: #00F0FF;
}

.upload-title {
  font-family: 'Exo 2', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: white;
  margin-bottom: 8px;
}

.upload-hint {
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

/* ========== 上传中状态 ========== */
.uploading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.progress-ring-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
}

.progress-ring {
  width: 100%;
  height: 100%;
  animation: progressSpin 1s linear infinite;
}

@keyframes progressSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.progress-ring-fill {
  transition: stroke-dashoffset 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.uploading-text {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

/* ========== URL 上传按钮 ========== */
.url-upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: flex-start;
}

.url-upload-btn:hover {
  background: rgba(0, 240, 255, 0.1);
  border-color: rgba(0, 240, 255, 0.3);
  color: #00F0FF;
}

.url-icon {
  width: 16px;
  height: 16px;
}

/* ========== URL 上传模态框 ========== */
.url-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 1000;
  padding: 20px;
}

.url-modal {
  width: 100%;
  max-width: 450px;
  padding: 24px;
  background: rgba(13, 13, 18, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 20px;
}

.url-input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(10, 10, 10, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: white;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.url-input:focus {
  outline: none;
  border-color: #00F0FF;
  box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.1);
}

.url-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
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
  background: linear-gradient(135deg, #00F0FF, #00C0CC);
  border: none;
  color: #0a0a0a;
}

.btn-confirm:hover:not(:disabled) {
  box-shadow: 0 4px 15px rgba(0, 240, 255, 0.3);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Modal 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .url-modal,
.modal-leave-to .url-modal {
  transform: scale(0.9);
}

/* ========== 响应式 ========== */
@media (max-width: 640px) {
  .drop-zone {
    padding: 32px 20px;
  }

  .upload-icon {
    width: 40px;
    height: 40px;
  }

  .upload-title {
    font-size: 14px;
  }

  .upload-hint {
    font-size: 12px;
  }
}
</style>
