<template>
  <div class="detail-modal-overlay" @click.self="closeModal">
    <div class="detail-container" :class="{ 'loading': !image }">
      <!-- 关闭按钮 -->
      <button class="detail-close" @click="closeModal">
        <X class="close-icon" />
      </button>

      <!-- 加载状态 -->
      <div v-if="!image" class="detail-loading">
        <Loader2 class="spinner" />
      </div>

      <!-- 主内容 -->
      <template v-else>
        <!-- 图片展示区 -->
        <div class="image-showcase">
          <div class="image-wrapper">
            <img :src="image.url" :alt="image.title" class="main-image" />
            <div class="image-overlay">
              <button class="nav-btn prev" @click="navigateImage(-1)">
                <ChevronLeft />
              </button>
              <button class="nav-btn next" @click="navigateImage(1)">
                <ChevronRight />
              </button>
            </div>
          </div>

          <!-- 缩略图列表 -->
          <div class="thumbnail-strip">
            <button
              v-for="(img, i) in relatedImages"
              :key="img.id"
              class="thumbnail-item"
              :class="{ active: currentImageIndex === i }"
              @click="switchImage(i)"
            >
              <img :src="img.url" :alt="img.name || '图片'" />
            </button>
          </div>
        </div>

        <!-- 信息面板 -->
        <div class="info-panel">
          <!-- 作者信息 -->
          <div class="author-section">
            <div class="author-avatar" :style="{ backgroundImage: `url(${image.author.avatar})` }"></div>
            <div class="author-info">
              <span class="author-name">{{ image.author.name }}</span>
              <span class="author-stats">{{ image.author.followers }} 关注者</span>
            </div>
            <button class="follow-btn" :class="{ following: image.author.isFollowing }">
              {{ image.author.isFollowing ? '已关注' : '+ 关注' }}
            </button>
          </div>

          <!-- 标题和描述 -->
          <h1 class="image-title">{{ image.title }}</h1>
          <p v-if="image.description" class="image-description">{{ image.description }}</p>

          <!-- 标签 -->
          <div v-if="image.tags?.length" class="tags-section">
            <span v-for="tag in image.tags" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>

          <!-- 统计信息 -->
          <div class="stats-row">
            <div class="stat-item">
              <Heart class="stat-icon" :class="{ active: image.isLiked }" />
              <span class="stat-value">{{ formatCount(image.likes) }}</span>
            </div>
            <div class="stat-item">
              <Bookmark class="stat-icon" :class="{ active: image.isSaved }" />
              <span class="stat-value">{{ formatCount(image.saves) }}</span>
            </div>
            <div class="stat-item">
              <Eye class="stat-icon" />
              <span class="stat-value">{{ formatCount(image.views) }}</span>
            </div>
            <div class="stat-item">
              <Calendar class="stat-icon" />
              <span class="stat-value">{{ formatDate(image.createdAt) }}</span>
            </div>
          </div>

          <!-- 操作按钮组 -->
          <div class="action-buttons">
            <button class="action-btn" :class="{ active: image.isLiked }" @click="toggleLike">
              <Heart class="btn-icon" />
              <span>{{ image.isLiked ? '已赞' : '点赞' }}</span>
            </button>
            <button class="action-btn" :class="{ active: image.isSaved }" @click="toggleSave">
              <Bookmark class="btn-icon" />
              <span>{{ image.isSaved ? '已收藏' : '收藏' }}</span>
            </button>
            <button class="action-btn" @click="downloadImage">
              <Download class="btn-icon" />
              <span>下载</span>
            </button>
            <button class="action-btn share" @click="shareImage">
              <Share2 class="btn-icon" />
              <span>分享</span>
            </button>
          </div>

          <!-- EXIF 信息 -->
          <div class="exif-section" v-if="image.exif">
            <div class="exif-grid">
              <div class="exif-item">
                <span class="exif-label">相机</span>
                <span class="exif-value">{{ image.exif.camera }}</span>
              </div>
              <div class="exif-item">
                <span class="exif-label">镜头</span>
                <span class="exif-value">{{ image.exif.lens }}</span>
              </div>
              <div class="exif-item">
                <span class="exif-label">焦距</span>
                <span class="exif-value">{{ image.exif.focalLength }}</span>
              </div>
              <div class="exif-item">
                <span class="exif-label">ISO</span>
                <span class="exif-value">{{ image.exif.iso }}</span>
              </div>
            </div>
          </div>

          <!-- 许可信息 -->
          <div class="license-section">
            <CreativeCommons class="license-icon" />
            <span class="license-text">CC BY 4.0</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  X, Loader2, ChevronLeft, ChevronRight, Heart, Bookmark,
  Eye, Calendar, Download, Share2, CreativeCommons
} from 'lucide-vue-next'

// Props
const props = defineProps({
  imageId: String,
  images: Array, // 图片列表，用于导航
  initialIndex: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits(['close'])

// Refs
const currentImageIndex = ref(props.initialIndex)

// 监听 initialIndex 变化
watch(() => props.initialIndex, (newVal) => {
  currentImageIndex.value = newVal
})

// Computed
const image = computed(() => {
  const img = props.images?.[currentImageIndex.value]
  if (!img) return null

  // 转换后端 PictureVO 格式为组件期望的格式
  return {
    id: img.id,
    url: img.url,
    title: img.name || '未命名',
    description: img.introduction || '',
    tags: img.tags || [],
    category: img.category,
    author: {
      id: img.UserId,
      name: img.user?.userName || '未知用户',
      avatar: img.user?.userAvatar || '',
      followers: 0, // 后端暂无此字段
      isFollowing: false
    },
    likes: 0, // 后端暂无点赞字段
    isLiked: false,
    saves: 0, // 后端暂无收藏字段
    isSaved: false,
    views: 0, // 后端暂无浏览字段
    createdAt: img.createTime || new Date(),
    exif: null, // 后端暂无 EXIF 信息
    picSize: img.picSize,
    picWidth: img.picWidth,
    picHeight: img.picHeight,
    picFormat: img.picFormat
  }
})

const relatedImages = computed(() => props.images || [])

// Methods
const closeModal = () => emit('close')

const switchImage = (index) => {
  currentImageIndex.value = index
}

const navigateImage = (direction) => {
  const newIndex = currentImageIndex.value + direction
  if (newIndex >= 0 && newIndex < relatedImages.value.length) {
    currentImageIndex.value = newIndex
  }
}

const toggleLike = () => {
  if (image.value) {
    image.value.isLiked = !image.value.isLiked
    image.value.likes += image.value.isLiked ? 1 : -1
  }
}

const toggleSave = () => {
  if (image.value) {
    image.value.isSaved = !image.value.isSaved
    image.value.saves += image.value.isSaved ? 1 : -1
  }
}

const downloadImage = () => {
  if (image.value?.url) {
    const link = document.createElement('a')
    link.href = image.value.url
    link.download = image.value.title || 'image'
    link.click()
  }
}

const shareImage = () => {
  if (navigator.share && image.value) {
    navigator.share({
      title: image.value.title,
      text: image.value.description,
      url: window.location.href
    })
  } else {
    // 复制链接到剪贴板
    navigator.clipboard.writeText(window.location.href)
  }
}

const formatCount = (count) => {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M'
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
  return count?.toString() || '0'
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
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
}

/* ========== 遮罩层 ========== */
.detail-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(30px);
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
.detail-container {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 32px;
  width: 100%;
  max-width: 1400px;
  max-height: 90vh;
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 24px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.8),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
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

.detail-close {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
}

.detail-close:hover {
  background: var(--lava);
  border-color: var(--lava);
}

.close-icon {
  width: 20px;
  height: 20px;
}

/* ========== 加载状态 ========== */
.detail-loading {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.spinner {
  width: 48px;
  height: 48px;
  color: var(--electric);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========== 图片展示区 ========== */
.image-showcase {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  background: var(--void-lighter);
  border-radius: 16px;
  overflow: hidden;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.image-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-wrapper:hover .image-overlay {
  opacity: 1;
}

.nav-btn {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  background: rgba(255, 61, 0, 0.3);
  border-color: var(--lava);
}

/* ========== 缩略图列表 ========== */
.thumbnail-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px;
  scrollbar-width: none;
}

.thumbnail-strip::-webkit-scrollbar {
  display: none;
}

.thumbnail-item {
  flex-shrink: 0;
  width: 80px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-item:hover,
.thumbnail-item.active {
  border-color: var(--electric);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
}

/* ========== 信息面板 ========== */
.info-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  padding-right: 8px;
}

/* 作者信息 */
.author-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  background-color: var(--void-lighter);
}

.author-info {
  flex: 1;
}

.author-name {
  display: block;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.author-stats {
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.follow-btn {
  padding: 8px 16px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: white;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.follow-btn:hover {
  background: var(--lava);
  border-color: var(--lava);
}

.follow-btn.following {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
}

/* 标题 */
.image-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1.3;
}

.image-description {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

/* 标签 */
.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 6px 12px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  color: var(--electric);
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 20px;
}

/* 统计 */
.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-icon {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.4);
}

.stat-icon.active {
  color: var(--lava);
}

.stat-value {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.action-btn.active {
  color: var(--lava);
  background: rgba(255, 61, 0, 0.1);
  border-color: rgba(255, 61, 0, 0.2);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* EXIF 信息 */
.exif-section {
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.exif-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.exif-item {
  display: flex;
  justify-content: space-between;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
}

.exif-label {
  color: rgba(255, 255, 255, 0.4);
}

.exif-value {
  color: rgba(255, 255, 255, 0.7);
}

/* 许可信息 */
.license-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.license-icon {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.4);
}

.license-text {
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .detail-container {
    grid-template-columns: 1fr;
    max-height: 85vh;
    overflow-y: auto;
  }

  .image-wrapper {
    aspect-ratio: 16 / 9;
  }
}

@media (max-width: 640px) {
  .detail-container {
    padding: 16px;
    border-radius: 16px;
  }

  .upload-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
