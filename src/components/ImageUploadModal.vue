<template>
  <div class="upload-modal-overlay" @click.self="closeModal">
    <div class="upload-container">
      <!-- 头部 -->
      <div class="upload-header">
        <h2 class="upload-title">上传作品</h2>
        <button class="close-btn" @click="closeModal">
          <X class="close-icon" />
        </button>
      </div>

      <!-- 模式切换 Tabs -->
      <div class="upload-tabs">
        <button
          class="tab-btn"
          :class="{ active: uploadMode === 'file' }"
          @click="uploadMode = 'file'"
        >
          <FileImage class="tab-icon" />
          文件上传
        </button>
        <button
          class="tab-btn"
          :class="{ active: uploadMode === 'url' }"
          @click="uploadMode = 'url'"
        >
          <Link2 class="tab-icon" />
          URL上传
        </button>
        <div class="tab-indicator" :style="{ transform: uploadMode === 'file' ? 'translateX(0)' : 'translateX(100%)' }"></div>
      </div>

      <!-- 可滚动内容区域 -->
      <div class="upload-body">
        <!-- 文件上传模式 -->
        <Transition name="mode" mode="out-in">
          <div v-if="uploadMode === 'file'" key="file" class="upload-content-wrapper">
            <!-- 上传区域 -->
            <div
              v-if="!uploadedPicture"
              class="upload-zone"
              :class="{ 'dragover': isDragOver, 'uploading': isUploading }"
              @dragover.prevent="isDragOver = true"
              @dragleave.prevent="isDragOver = false"
              @drop.prevent="handleDrop"
              @click="triggerFileInput"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="hidden-input"
                @change="handleFileSelect"
              >

              <!-- 上传前状态 -->
              <div v-if="!isUploading" class="upload-content">
                <div class="upload-icon-wrapper">
                  <UploadCloud class="upload-icon" />
                  <div class="upload-icon-glow"></div>
                </div>
                <h3 class="upload-heading">拖拽图片到这里</h3>
                <p class="upload-subheading">或点击选择文件</p>
                <div class="upload-limits">
                  <span class="limit-item">支持 JPG、PNG、WEBP</span>
                  <span class="limit-separator">•</span>
                  <span class="limit-item">单个文件最大 10MB</span>
                </div>
              </div>

              <!-- 上传中状态 -->
              <div v-else class="uploading-content">
                <div class="upload-spinner"></div>
                <p class="uploading-text">正在上传...</p>
                <div class="upload-progress-bar">
                  <div class="upload-progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                </div>
                <p class="upload-progress-text">{{ uploadProgress }}%</p>
              </div>
            </div>

            <!-- 上传成功预览 -->
            <div v-else class="uploaded-preview">
              <img :src="uploadedPicture.url" class="preview-image-large" />
              <div class="preview-meta">
                <CheckCircle class="check-icon" />
                <span>上传成功</span>
              </div>
              <button class="reupload-btn" @click="clearUpload">
                <RotateCcw class="reupload-icon" />
                重新上传
              </button>
            </div>
          </div>

          <!-- URL上传模式 -->
          <div v-else key="url" class="upload-content-wrapper">
            <div class="url-upload-section">
              <div class="url-input-wrapper">
                <Link2 class="url-input-icon" />
                <input
                  v-model="urlInput"
                  type="text"
                  class="url-input"
                  placeholder="粘贴图片URL地址..."
                  @keydown.enter="fetchFromUrl"
                  :disabled="isUploading"
                />
              </div>
              <button
                class="fetch-btn"
                :disabled="!urlInput.trim() || isUploading"
                @click="fetchFromUrl"
              >
                <Loader2 v-if="isUploading" class="btn-icon spin" />
                <Download v-else class="btn-icon" />
                {{ isUploading ? '抓取中...' : '抓取图片' }}
              </button>
            </div>

            <!-- URL抓取成功预览 -->
            <div v-if="uploadedPicture && uploadMode === 'url'" class="uploaded-preview url-preview">
              <img :src="uploadedPicture.url" class="preview-image-large" />
              <div class="preview-meta">
                <CheckCircle class="check-icon" />
                <span>抓取成功</span>
              </div>
              <button class="reupload-btn" @click="clearUpload">
                <RotateCcw class="reupload-icon" />
                重新抓取
              </button>
            </div>
          </div>
        </Transition>

        <!-- 图片信息表单 -->
        <Transition name="form">
          <div v-if="uploadedPicture" class="upload-form">
            <div class="form-section-title">
              <div class="title-line"></div>
              <span class="title-text">填写图片信息</span>
              <div class="title-line"></div>
            </div>

            <div class="form-group">
              <label class="form-label">图片名称</label>
              <input
                v-model="form.name"
                type="text"
                class="form-input"
                placeholder="给图片起个名字..."
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">分类</label>
                <select v-model="form.category" class="form-select">
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
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">标签</label>
              <div class="tags-input-wrapper">
                <input
                  v-model="tagInput"
                  class="tags-input"
                  placeholder="输入标签后按回车添加"
                  @keydown.enter.prevent="addTag"
                >
                <div class="tags-list">
                  <span v-for="(tag, index) in form.tags" :key="index" class="tag-item">
                    {{ tag }}
                    <button @click="removeTag(index)" class="tag-remove">
                      <X class="tag-remove-icon" />
                    </button>
                  </span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">介绍</label>
              <textarea
                v-model="form.introduction"
                class="form-textarea"
                placeholder="添加图片介绍..."
                rows="3"
              ></textarea>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 底部按钮 - 固定在底部 -->
      <div class="upload-footer">
        <button class="btn btn-secondary" @click="closeModal">取消</button>
        <button
          v-if="uploadedPicture"
          class="btn btn-primary"
          :disabled="isSubmitting"
          @click="submitPicture"
        >
          <Loader2 v-if="isSubmitting" class="btn-icon spin" />
          <Check v-else class="btn-icon" />
          {{ isSubmitting ? '保存中...' : '保存提交' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import {
  X, UploadCloud, CheckCircle, Loader2, FileImage, Link2,
  Download, RotateCcw, Check
} from 'lucide-vue-next'
import { uploadPicture, uploadPictureByUrl, updatePicture } from '@/config/api.js'

// Props
const props = defineProps({
  show: Boolean
})

// Emits
const emit = defineEmits(['close', 'uploaded'])

// Refs
const fileInputRef = ref(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const isSubmitting = ref(false)
const uploadProgress = ref(0)
const uploadMode = ref('file') // 'file' | 'url'
const urlInput = ref('')
const tagInput = ref('')

// 已上传的图片信息
const uploadedPicture = ref(null)

// 表单数据
const form = reactive({
  name: '',
  category: '',
  tags: [],
  introduction: ''
})

// Methods
const closeModal = () => emit('close')

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = async (e) => {
  const file = e.target.files?.[0]
  if (file) {
    await uploadFile(file)
  }
}

const handleDrop = async (e) => {
  isDragOver.value = false
  const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'))
  if (file) {
    await uploadFile(file)
  }
}

// 上传文件
const uploadFile = async (file) => {
  if (file.size > 10 * 1024 * 1024) {
    alert('文件超过 10MB 限制')
    return
  }

  isUploading.value = true
  uploadProgress.value = 0

  // 模拟进度
  const progressInterval = setInterval(() => {
    if (uploadProgress.value < 90) {
      uploadProgress.value += 10
    }
  }, 100)

  try {
    const result = await uploadPicture(file)
    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (result.code === 0 && result.data) {
      uploadedPicture.value = result.data
      // 预填充名称（去掉扩展名）
      form.name = result.data.name || ''
    } else {
      alert(result.message || '上传失败')
    }
  } catch (error) {
    clearInterval(progressInterval)
    alert('上传失败: ' + error.message)
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

// 通过URL抓取
const fetchFromUrl = async () => {
  const url = urlInput.value.trim()
  if (!url) return

  isUploading.value = true

  try {
    const result = await uploadPictureByUrl(url)

    if (result.code === 0 && result.data) {
      uploadedPicture.value = result.data
      form.name = result.data.name || ''
      urlInput.value = ''
    } else {
      alert(result.message || '抓取失败')
    }
  } catch (error) {
    alert('抓取失败: ' + error.message)
  } finally {
    isUploading.value = false
  }
}

// 清除上传
const clearUpload = () => {
  uploadedPicture.value = null
  resetForm()
}

// 重置表单
const resetForm = () => {
  form.name = ''
  form.category = ''
  form.tags = []
  form.introduction = ''
  tagInput.value = ''
}

// 添加标签
const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
    tagInput.value = ''
  }
}

// 删除标签
const removeTag = (index) => {
  form.tags.splice(index, 1)
}

// 提交图片信息
const submitPicture = async () => {
  if (!uploadedPicture.value) return

  isSubmitting.value = true

  try {
    const result = await updatePicture({
      id: uploadedPicture.value.id,
      name: form.name || uploadedPicture.value.name,
      category: form.category,
      tags: form.tags,
      introduction: form.introduction
    })

    if (result.code === 0) {
      emit('uploaded')
      closeModal()
    } else {
      alert(result.message || '保存失败')
    }
  } catch (error) {
    alert('保存失败: ' + error.message)
  } finally {
    isSubmitting.value = false
  }
}

// 监听模式切换，清除状态
watch(uploadMode, () => {
  clearUpload()
  urlInput.value = ''
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Exo+2:wght@300;400;600&display=swap');

/* CSS 变量 */
:deep(:root) {
  --void: #0a0a0a;
  --void-lighter: #1a1a1a;
  --lava: #FF3D00;
  --lava-glow: #FF6B35;
  --electric: #00F0FF;
  --electric-glow: #4DFFFF;
  --purple: #9333EA;
}

/* ========== 遮罩层 ========== */
.upload-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ========== 容器 ========== */
.upload-container {
  width: 100%;
  max-width: 540px;
  max-height: 85vh;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.9),
    0 0 100px rgba(255, 61, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ========== 头部 ========== */
.upload-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.upload-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0;
  letter-spacing: 1px;
}

.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.25s ease;
}

.close-btn:hover {
  background: rgba(255, 61, 0, 0.1);
  border-color: rgba(255, 61, 0, 0.3);
  color: var(--lava);
}

.close-icon {
  width: 18px;
  height: 18px;
}

/* ========== Tabs ========== */
.upload-tabs {
  position: relative;
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-radius: 10px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.tab-btn:hover {
  color: rgba(255, 255, 255, 0.8);
}

.tab-btn.active {
  color: white;
}

.tab-icon {
  width: 16px;
  height: 16px;
}

.tab-indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: linear-gradient(135deg, var(--purple), #7C3AED);
  border-radius: 10px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 10px rgba(147, 51, 234, 0.3);
}

/* ========== 内容区域 ========== */
.upload-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  min-height: 0;
}

/* 自定义滚动条 */
.upload-body::-webkit-scrollbar {
  width: 6px;
}

.upload-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 3px;
}

.upload-body::-webkit-scrollbar-thumb {
  background: rgba(147, 51, 234, 0.3);
  border-radius: 3px;
}

.upload-body::-webkit-scrollbar-thumb:hover {
  background: rgba(147, 51, 234, 0.5);
}

.upload-content-wrapper {
  /* 移除固定高度，让内容自适应 */
}

/* Mode 切换动画 */
.mode-enter-active,
.mode-leave-active {
  transition: all 0.3s ease;
}

.mode-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.mode-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* ========== 上传区域 ========== */
.upload-zone {
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.upload-zone::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(0, 240, 255, 0.05), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.upload-zone:hover::before,
.upload-zone.dragover::before {
  opacity: 1;
}

.upload-zone:hover {
  border-color: rgba(0, 240, 255, 0.3);
}

.upload-zone.dragover {
  border-color: var(--electric);
  background: rgba(0, 240, 255, 0.05);
}

.upload-zone.uploading {
  border-style: solid;
  border-color: var(--lava);
  pointer-events: none;
}

.upload-content {
  position: relative;
}

.upload-icon-wrapper {
  position: relative;
  display: inline-flex;
  justify-content: center;
  margin-bottom: 16px;
}

.upload-icon {
  width: 56px;
  height: 56px;
  color: var(--electric);
  position: relative;
  z-index: 1;
}

.upload-icon-glow {
  position: absolute;
  width: 70px;
  height: 70px;
  background: radial-gradient(circle, rgba(0, 240, 255, 0.25), transparent 70%);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

.upload-heading {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin: 0 0 6px 0;
}

.upload-subheading {
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0 0 12px 0;
}

.upload-limits {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
}

.limit-separator {
  color: rgba(255, 255, 255, 0.15);
}

/* ========== 上传中状态 ========== */
.uploading-content {
  padding: 24px 0;
}

.upload-spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(255, 61, 0, 0.15);
  border-top-color: var(--lava);
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.uploading-text {
  font-family: 'Exo 2', sans-serif;
  font-size: 15px;
  color: white;
  margin: 0 0 14px 0;
}

.upload-progress-bar {
  width: 100%;
  max-width: 280px;
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  margin: 0 auto 8px;
  overflow: hidden;
}

.upload-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--lava), var(--lava-glow));
  border-radius: 2px;
  transition: width 0.2s ease;
}

.upload-progress-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 13px;
  color: var(--electric);
  margin: 0;
}

/* ========== URL上传区域 ========== */
.url-upload-section {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.url-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.url-input-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.3);
  pointer-events: none;
}

.url-input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: white;
  transition: all 0.3s ease;
}

.url-input:focus {
  outline: none;
  border-color: var(--purple);
  background: rgba(147, 51, 234, 0.05);
}

.url-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.url-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.fetch-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 20px;
  background: linear-gradient(135deg, var(--purple), #7C3AED);
  border: none;
  border-radius: 12px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.fetch-btn:hover:not(:disabled) {
  box-shadow: 0 4px 20px rgba(147, 51, 234, 0.4);
  transform: translateY(-1px);
}

.fetch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== 上传成功预览 ========== */
.uploaded-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.preview-image-large {
  width: 100%;
  max-height: 220px;
  object-fit: contain;
  border-radius: 12px;
  margin-bottom: 12px;
  background: var(--void-lighter);
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: 20px;
  margin-bottom: 12px;
}

.check-icon {
  width: 16px;
  height: 16px;
  color: #22c55e;
}

.preview-meta span {
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #22c55e;
}

.reupload-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.25s ease;
}

.reupload-btn:hover {
  background: rgba(255, 61, 0, 0.1);
  border-color: rgba(255, 61, 0, 0.25);
  color: var(--lava);
}

.reupload-icon {
  width: 14px;
  height: 14px;
}

.url-preview {
  margin-top: 16px;
}

/* ========== 表单区域 ========== */
.form-enter-active {
  transition: all 0.4s ease;
}

.form-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.upload-form {
  margin-top: 20px;
  padding-top: 20px;
}

.form-section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.title-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
}

.title-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.form-group {
  margin-bottom: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.form-label {
  display: block;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  background: rgba(10, 10, 10, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: white;
  transition: all 0.3s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--purple);
  box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.15);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.form-select {
  cursor: pointer;
}

.form-select option {
  background: var(--void-lighter);
}

.form-textarea {
  resize: vertical;
  min-height: 70px;
}

/* 标签输入 */
.tags-input-wrapper {
  position: relative;
}

.tags-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(10, 10, 10, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: white;
  transition: all 0.3s ease;
}

.tags-input:focus {
  outline: none;
  border-color: var(--purple);
  box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.15);
}

.tags-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px 6px 12px;
  background: rgba(147, 51, 234, 0.15);
  border: 1px solid rgba(147, 51, 234, 0.3);
  border-radius: 6px;
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  color: #e9d5ff;
  animation: tagSlideIn 0.2s ease-out;
}

@keyframes tagSlideIn {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.tag-remove {
  display: flex;
  align-items: center;
  padding: 0;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.tag-remove:hover {
  color: var(--lava);
  background: rgba(255, 61, 0, 0.15);
}

.tag-remove-icon {
  width: 12px;
  height: 12px;
}

/* ========== 底部按钮 ========== */
.upload-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, var(--lava), var(--lava-glow));
  color: white;
  box-shadow: 0 4px 20px rgba(255, 61, 0, 0.3);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 25px rgba(255, 61, 0, 0.45);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.btn-icon.spin {
  animation: spin 1s linear infinite;
}

.hidden-input {
  display: none;
}
</style>
