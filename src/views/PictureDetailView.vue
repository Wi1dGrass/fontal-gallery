<template>
  <div class="picture-detail-page">
    <!-- 顶部导航栏 -->
    <header class="detail-header">
      <button class="back-button" @click="goBack">
        <ArrowLeft class="back-icon" />
        <span>返回</span>
      </button>
      <h1 class="header-title">{{ picture?.name || '加载中...' }}</h1>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">加载中...</p>
    </div>

    <!-- 主内容 - 垂直流式布局 -->
    <main v-else-if="picture" class="detail-main">
      <!-- 大图展示区 -->
      <section class="image-section">
        <div class="image-wrapper" @click="openLightbox">
          <img
            :src="picture.url"
            :alt="picture.name"
            class="main-image"
            @load="onImageLoad"
            @error="imageLoadError"
          />
          <div v-if="!imageLoaded" class="image-skeleton">
            <Loader2 class="skeleton-spinner" />
          </div>
          <!-- 悬浮操作栏 -->
          <div class="image-actions">
            <button class="action-btn" @click.stop="downloadImage" title="下载">
              <Download class="action-icon" />
            </button>
            <button class="action-btn" @click.stop="toggleFullscreen" title="全屏">
              <Maximize class="action-icon" />
            </button>
            <button class="action-btn" @click.stop="shareImage" title="分享">
              <Share2 class="action-icon" />
            </button>
          </div>
          <!-- 全屏查看器 -->
          <div v-if="isFullscreen" class="fullscreen-viewer" @click="toggleFullscreen">
            <img :src="picture.url" class="fullscreen-image" />
            <button class="fullscreen-close" @click.stop="toggleFullscreen">
              <X class="close-icon" />
            </button>
          </div>
        </div>
      </section>

      <!-- 图片基本信息 -->
      <section class="info-section">
        <div class="info-header">
          <h2 class="picture-title">{{ picture.name }}</h2>
          <div class="picture-meta">
            <span class="meta-item">
              <Calendar class="meta-icon" />
              {{ formatDate(picture.createTime) }}
            </span>
            <span class="meta-item">
              <FileImage class="meta-icon" />
              {{ picture.picFormat?.toUpperCase() || 'JPG' }}
            </span>
            <span class="meta-item">
              <Frame class="meta-icon" />
              {{ picture.picWidth }} × {{ picture.picHeight }}
            </span>
            <span class="meta-item">
              <HardDrive class="meta-icon" />
              {{ formatSize(picture.picSize) }}
            </span>
          </div>
        </div>

        <!-- 描述 -->
        <p v-if="picture.introduction" class="picture-description">
          {{ picture.introduction }}
        </p>
      </section>

      <!-- 标签区 -->
      <section class="tags-section">
        <h3 class="section-title">
          <Tag class="title-icon" />
          标签
        </h3>
        <div class="tags-container">
          <button
            v-for="tag in picture.tags"
            :key="tag"
            class="tag-button"
            @click="searchByTag(tag)"
          >
            <Hash class="tag-icon" />
            <span class="tag-text">{{ tag }}</span>
          </button>
        </div>
      </section>

      <!-- 作者信息卡片 -->
      <section class="author-section">
        <div class="author-card">
          <div class="author-avatar-wrapper" @click="goToAuthor(picture.user?.id)">
            <img
              v-if="picture.user?.userAvatar"
              :src="picture.user.userAvatar"
              class="author-avatar"
              :alt="picture.user.userName"
            />
            <div v-else class="author-avatar-placeholder">
              {{ picture.user?.userName?.charAt(0)?.toUpperCase() || '?' }}
            </div>
          </div>
          <div class="author-info">
            <h4 class="author-name">{{ picture.user?.userName || '未知用户' }}</h4>
            <p class="author-stats">{{ formatAuthorStats(picture.user) }}</p>
          </div>
          <button
            class="follow-button"
            :class="{ following: isFollowing }"
            @click="toggleFollow"
          >
            <UserPlus v-if="!isFollowing" class="follow-icon" />
            <UserCheck v-else class="follow-icon" />
            {{ isFollowing ? '已关注' : '关注' }}
          </button>
        </div>
      </section>

      <!-- 作者的其他作品 -->
      <section v-if="authorPictures.length > 0" class="author-works-section">
        <h3 class="section-title">
          <User class="title-icon" />
          作者的其他作品
        </h3>
        <div class="works-grid">
          <div
            v-for="pic in authorPictures.slice(0, 3)"
            :key="pic.id"
            class="work-item"
            @click="navigateToPicture(pic.id)"
          >
            <img :src="pic.url" :alt="pic.name" class="work-image" />
            <div class="work-overlay">
              <span class="work-name">{{ pic.name }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 相关推荐 -->
      <section v-if="relatedPictures.length > 0" class="related-section">
        <h3 class="section-title">
          <Sparkles class="title-icon" />
          相关推荐
          <span v-if="firstTag" class="recommend-hint">基于 #{{ firstTag }}</span>
        </h3>
        <div class="related-grid">
          <div
            v-for="pic in relatedPictures"
            :key="pic.id"
            class="related-item"
            @click="navigateToPicture(pic.id)"
          >
            <img :src="pic.url" :alt="pic.name" class="related-image" />
            <div class="related-info">
              <span class="related-name">{{ pic.name }}</span>
              <span class="related-author">{{ pic.user?.userName || '未知' }}</span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 错误状态 -->
    <div v-else class="error-state">
      <ImageOff class="error-icon" />
      <h2>图片未找到</h2>
      <p>该图片可能已被删除或不存在</p>
      <button class="error-button" @click="$router.push('/')">
        <Home class="button-icon" />
        返回首页
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, Download, Maximize, Share2, X, Tag, Hash,
  Calendar, FileImage, Frame, HardDrive, UserPlus, UserCheck,
  User, Sparkles, Home, ImageOff, Loader2
} from 'lucide-vue-next'
import { getPictureById, getPictureListPage } from '@/config/api.js'
import { setPendingSearchTag } from '@/composables/searchState.js'

const route = useRoute()
const router = useRouter()

// 状态
const picture = ref(null)
const loading = ref(true)
const imageLoaded = ref(false)
const isFullscreen = ref(false)
const isFollowing = ref(false)
const relatedPictures = ref([])
const authorPictures = ref([])

// 计算第一个标签（用于推荐）
const firstTag = computed(() => {
  if (picture.value?.tags && picture.value.tags.length > 0) {
    return picture.value.tags[0]
  }
  return null
})

// 获取图片详情
const fetchPicture = async () => {
  loading.value = true
  imageLoaded.value = false

  try {
    const result = await getPictureById(route.params.id)
    if (result.code === 0 && result.data) {
      picture.value = result.data
      // 并行获取相关图片和作者作品
      await Promise.all([
        fetchRelatedPictures(),
        fetchAuthorPictures()
      ])
    }
  } catch (error) {
    // 静默处理错误
  } finally {
    loading.value = false
  }
}

// 获取相关推荐（基于第一个标签）
const fetchRelatedPictures = async () => {
  if (!picture.value?.tags || picture.value.tags.length === 0) return

  try {
    const tag = picture.value.tags[0]
    // 使用搜索关键词获取相关图片
    const result = await getPictureListPage({
      current: 1,
      pageSize: 8,
      searchText: tag
    })
    if (result.code === 0 && result.data?.records) {
      // 过滤掉当前图片
      relatedPictures.value = result.data.records
        .filter(p => p.id !== picture.value.id)
        .slice(0, 8)
    }
  } catch (error) {
    // 静默处理错误
  }
}

// 获取作者的其他作品
const fetchAuthorPictures = async () => {
  if (!picture.value?.userId) return

  try {
    const result = await getPictureListPage({
      current: 1,
      pageSize: 4,
      userId: String(picture.value.userId)  // 确保作为字符串发送
    })
    if (result.code === 0 && result.data?.records) {
      // 过滤掉当前图片
      authorPictures.value = result.data.records
        .filter(p => p.id !== picture.value.id)
        .slice(0, 3)
    }
  } catch (error) {
    // 静默处理错误
  }
}

// 点击标签搜索
const searchByTag = (tag) => {
  // 设置待搜索标签到共享状态
  setPendingSearchTag(tag)
  // 跳转到首页（不带 query 参数）
  router.push('/')
}

// 导航到图片详情
const navigateToPicture = (id) => {
  router.push(`/picture/${id}`)
  // 图片加载完成后会自动滚动到图片区域
}

// 跳转到作者页面
const goToAuthor = (userId) => {
  if (userId) {
    router.push(`/user/${userId}`)
  }
}

// 全屏切换
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// 打开灯箱查看
const openLightbox = () => {
  isFullscreen.value = true
}

// 下载图片
const downloadImage = () => {
  if (picture.value?.url) {
    const link = document.createElement('a')
    link.href = picture.value.url
    link.download = picture.value.name || 'image'
    link.click()
  }
}

// 分享图片
const shareImage = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: picture.value.name,
        text: picture.value.introduction,
        url: window.location.href
      })
    } catch {
      // 用户取消
    }
  } else {
    navigator.clipboard.writeText(window.location.href)
    // 可选：显示提示
  }
}

// 关注切换
const toggleFollow = () => {
  isFollowing.value = !isFollowing.value
}

// 图片加载完成
const onImageLoad = () => {
  imageLoaded.value = true
}

const imageLoadError = () => {
  imageLoaded.value = true // 即使失败也显示骨架
}

// 返回
const goBack = () => {
  router.back()
}

// 格式化文件大小
const formatSize = (bytes) => {
  if (!bytes) return '未知'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '未知'
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 格式化作者统计
const formatAuthorStats = (user) => {
  return '上传了多张作品'
}

// 生命周期
onMounted(() => {
  fetchPicture()
})

// 监听路由参数变化（点击相关推荐/作者作品时）
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    // 立即滚动到顶部，展示图片区域
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // 重置加载状态
    imageLoaded.value = false
    // 获取新图片数据
    fetchPicture()
  }
})

// 监听路由变化（切换图片时）
onUnmounted(() => {
  // 清理工作
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600;700&display=swap');

/* ========== 全局容器 ========== */
.picture-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0f 0%, #0f0a15 50%, #0a0f1a 100%);
  position: relative;
}

/* 页面进入动画 */
@keyframes slideUpFadeIn {
  from {
    opacity: 0;
    transform: translateY(60px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 背景装饰 */
.picture-detail-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(0, 240, 255, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 61, 0, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(255, 61, 0, 0.02) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* ========== 顶部导航 ========== */
.detail-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 24px;
  background: rgba(10, 10, 15, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.back-button:hover {
  background: rgba(255, 61, 0, 0.1);
  border-color: rgba(255, 61, 0, 0.3);
  color: #FF3D00;
  transform: translateX(-2px);
}

.back-icon {
  width: 18px;
  height: 18px;
}

.header-title {
  flex: 1;
  font-family: 'Orbitron', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== 加载状态 ========== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 20px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(0, 240, 255, 0.1);
  border-top-color: #00F0FF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

/* ========== 主内容 ========== */
.detail-main {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  animation: slideUpFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* ========== 大图展示区 ========== */
.image-section {
  margin-bottom: 32px;
  animation: slideUpFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
  opacity: 0;
}

.image-wrapper {
  position: relative;
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  background: rgba(10, 10, 15, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
}

.main-image {
  display: block;
  width: 100%;
  height: auto;
  max-height: 85vh;
  object-fit: contain;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.image-wrapper:hover .main-image {
  transform: scale(1.01);
}

.image-skeleton {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(10, 10, 15, 0.9), rgba(20, 20, 30, 0.9));
}

.skeleton-spinner {
  width: 48px;
  height: 48px;
  color: #00F0FF;
  animation: spin 1s linear infinite;
}

/* 悬浮操作栏 */
.image-actions {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.action-btn:hover {
  background: rgba(255, 61, 0, 0.2);
  border-color: rgba(255, 61, 0, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 61, 0, 0.3);
}

.action-icon {
  width: 20px;
  height: 20px;
}

/* 全屏查看器 */
.fullscreen-viewer {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.95);
  cursor: zoom-out;
}

.fullscreen-image {
  max-width: 95vw;
  max-height: 95vh;
  object-fit: contain;
}

.fullscreen-close {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 61, 0, 0.2);
  border: 1px solid rgba(255, 61, 0, 0.3);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.fullscreen-close:hover {
  background: #FF3D00;
  transform: rotate(90deg);
}

.close-icon {
  width: 24px;
  height: 24px;
}

/* ========== 信息区 ========== */
.info-section {
  margin-bottom: 32px;
  animation: slideUpFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
  opacity: 0;
}

.info-header {
  margin-bottom: 16px;
}

.picture-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0 0 16px 0;
  line-height: 1.3;
}

.picture-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.meta-icon {
  width: 14px;
  height: 14px;
  color: #00F0FF;
}

.picture-description {
  font-family: 'Exo 2', sans-serif;
  font-size: 15px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

/* ========== 标签区 ========== */
.tags-section {
  margin-bottom: 40px;
  animation: slideUpFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
  opacity: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0 0 20px 0;
}

.title-icon {
  width: 18px;
  height: 18px;
  color: #FF3D00;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(0, 240, 255, 0.08);
  border: 1px solid rgba(0, 240, 255, 0.15);
  border-radius: 24px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #00F0FF;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.tag-button:hover {
  background: rgba(0, 240, 255, 0.15);
  border-color: rgba(0, 240, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 240, 255, 0.2);
}

.tag-icon {
  width: 14px;
  height: 14px;
}

/* ========== 作者区 ========== */
.author-section {
  margin-bottom: 40px;
  animation: slideUpFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards;
  opacity: 0;
}

.author-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(20, 20, 30, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.author-card:hover {
  background: rgba(20, 20, 30, 0.5);
  border-color: rgba(255, 255, 255, 0.08);
}

.author-avatar-wrapper {
  flex-shrink: 0;
  cursor: pointer;
}

.author-avatar {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  object-fit: cover;
  border: 2px solid rgba(0, 240, 255, 0.2);
  transition: all 0.3s ease;
}

.author-avatar-wrapper:hover .author-avatar {
  border-color: #00F0FF;
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
}

.author-avatar-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #00F0FF, #4DFFFF);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Orbitron', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #0a0a0a;
  border: 2px solid rgba(0, 240, 255, 0.2);
}

.author-info {
  flex: 1;
  min-width: 0;
}

.author-name {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0 0 4px 0;
}

.author-stats {
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.follow-button {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(255, 61, 0, 0.1);
  border: 1px solid rgba(255, 61, 0, 0.2);
  border-radius: 24px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #FF3D00;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.follow-button:hover {
  background: #FF3D00;
  border-color: #FF3D00;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 61, 0, 0.4);
}

.follow-button.following {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}

.follow-button.following:hover {
  background: rgba(255, 61, 0, 0.1);
  border-color: rgba(255, 61, 0, 0.2);
  color: #FF3D00;
}

.follow-icon {
  width: 16px;
  height: 16px;
}

/* ========== 作品网格 ========== */
.author-works-section {
  margin-bottom: 40px;
  animation: slideUpFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
  opacity: 0;
}

.related-section {
  margin-bottom: 40px;
  animation: slideUpFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.35s forwards;
  opacity: 0;
}

.works-grid,
.related-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.work-item,
.related-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  background: rgba(10, 10, 15, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.work-item:hover,
.related-item:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(0, 240, 255, 0.3);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 30px rgba(0, 240, 255, 0.15);
}

.work-image,
.related-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.work-item:hover .work-image,
.related-item:hover .related-image {
  transform: scale(1.1);
}

.work-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 16px;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(0, 0, 0, 0.3) 60%,
    transparent 100%
  );
}

.work-name,
.related-name {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-info {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 12px;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(0, 0, 0, 0.2) 60%,
    transparent 100%
  );
  pointer-events: none;
}

.related-name {
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-author {
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.recommend-hint {
  margin-left: auto;
  padding: 4px 10px;
  background: rgba(255, 61, 0, 0.1);
  border: 1px solid rgba(255, 61, 0, 0.2);
  border-radius: 12px;
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #FF3D00;
  text-transform: none;
  letter-spacing: 0;
}

/* ========== 错误状态 ========== */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 20px;
  text-align: center;
}

.error-icon {
  width: 80px;
  height: 80px;
  color: rgba(255, 255, 255, 0.15);
}

.error-state h2 {
  font-family: 'Orbitron', sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.error-state p {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.error-button {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 14px 28px;
  background: #FF3D00;
  border: none;
  border-radius: 12px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.error-button:hover {
  background: #FF6B35;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 61, 0, 0.4);
}

.button-icon {
  width: 18px;
  height: 18px;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .detail-main {
    padding: 16px;
  }

  .detail-header {
    padding: 12px 16px;
  }

  .header-title {
    font-size: 14px;
  }

  .picture-title {
    font-size: 20px;
  }

  .picture-meta {
    gap: 8px;
  }

  .meta-item {
    font-size: 11px;
    padding: 6px 10px;
  }

  .works-grid,
  .related-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .author-card {
    padding: 16px;
  }

  .author-avatar,
  .author-avatar-placeholder {
    width: 48px;
    height: 48px;
  }

  .author-name {
    font-size: 16px;
  }

  .follow-button {
    padding: 10px 16px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .works-grid,
  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
