<template>
  <div class="user-detail-page" ref="pageRef">
    <!-- 背景装饰 -->
    <div class="background-fx">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="grid-overlay"></div>
    </div>

    <!-- 顶部导航 -->
    <header class="page-header">
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>返回</span>
      </button>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="spinner-ring"></div>
      <p class="loading-text">加载中...</p>
    </div>

    <!-- 主内容 -->
    <main v-else-if="user" class="main-content">
      <!-- 用户信息卡片 -->
      <section class="profile-card">
        <div class="profile-glow"></div>

        <div class="profile-header">
          <div class="avatar-container">
            <img
              v-if="user.userAvatar"
              :src="user.userAvatar"
              class="avatar-image"
              :alt="user.userName"
            />
            <div v-else class="avatar-placeholder">
              {{ user.userName?.charAt(0)?.toUpperCase() || '?' }}
            </div>
            <div class="avatar-ring"></div>
          </div>

          <div class="profile-info">
            <h1 class="user-name">{{ user.userName }}</h1>
            <p v-if="user.userProfile" class="user-bio">{{ user.userProfile }}</p>
            <div class="user-meta">
              <span class="meta-item role-badge" :class="user.userRole === 'admin' ? 'admin' : 'user'">
                {{ user.userRole === 'admin' ? '管理员' : '创作者' }}
              </span>
              <span class="meta-item join-date">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {{ formatDate(user.createTime) }} 加入
              </span>
            </div>
          </div>
        </div>

        <!-- 作品数统计 -->
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-value">{{ pictureCount }}</span>
            <span class="stat-label">作品</span>
          </div>
        </div>
      </section>

      <!-- 图片作品网格 -->
      <section class="gallery-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            作品集
          </h2>
          <span class="picture-count">{{ pictureCount }} 张</span>
        </div>

        <!-- 空状态 -->
        <div v-if="pictures.length === 0 && !isLoadingMore" class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <p>暂无作品</p>
        </div>

        <!-- 图片网格 -->
        <div v-else class="picture-grid">
          <div
            v-for="(pic, index) in displayPictures"
            :key="pic.id"
            class="picture-card"
            :style="{ animationDelay: `${index * 50}ms` }"
            @click="openPicture(pic.id)"
          >
            <div class="card-image-wrapper">
              <img
                :src="pic.url"
                :alt="pic.name"
                class="card-image"
                :class="{ loaded: pic.loaded }"
                @load="pic.loaded = true"
              />
              <div v-if="!pic.loaded" class="card-skeleton"></div>
            </div>
            <div class="card-overlay">
              <span class="card-title">{{ pic.name }}</span>
              <div class="card-meta">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                {{ pic.picFormat?.toUpperCase() || 'JPG' }}
              </div>
            </div>
          </div>
        </div>

        <!-- 初次加载更多按钮 (显示8张后出现) -->
        <div v-if="showLoadMoreButton && hasMore" class="load-more-wrapper">
          <button
            class="load-more-btn"
            :class="{ loading: isLoadingMore }"
            @click="loadMore"
          >
            <span v-if="!isLoadingMore">加载更多</span>
            <span v-else>加载中...</span>
            <svg v-if="!isLoadingMore" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <svg v-else class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </button>
        </div>

        <!-- 自动加载状态 (滚动到底部时) -->
        <div v-else-if="isLoadingMore && pictures.length > 0" class="loading-more-wrapper">
          <div class="spinner-small"></div>
          <p class="loading-more-text">加载中...</p>
        </div>

        <!-- 全部加载完成 -->
        <div v-else-if="!hasMore && pictures.length > 0" class="no-more-wrapper">
          <p class="no-more-text">已展示全部 {{ pictureCount }} 张作品</p>
        </div>
      </section>
    </main>

    <!-- 错误状态 -->
    <div v-else class="error-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>用户不存在</p>
      <button class="error-back-btn" @click="goBack">返回</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getPictureListPage } from '@/config/api.js'

const router = useRouter()
const route = useRoute()
const pageRef = ref(null)

// 状态
const loading = ref(true)
const user = ref(null)
const pictures = ref([])
const currentPage = ref(1)
const pageSize = ref(8)  // 改为 8
const totalItems = ref(0)
const isLoadingMore = ref(false)
const hasClickedLoadMore = ref(false)  // 是否点击过"加载更多"
const observer = ref(null)  // Intersection Observer

// 计算属性
const userId = computed(() => route.params.userId)
const pictureCount = computed(() => totalItems.value)
const hasMore = computed(() => pictures.value.length < totalItems.value)

// 是否显示"加载更多"按钮 (第一次加载8张后，且还没点击过)
const showLoadMoreButton = computed(() => {
  return pictures.value.length >= 8 && !hasClickedLoadMore.value && hasMore.value
})

// 显示的图片
const displayPictures = computed(() => pictures.value)

// 获取用户信息
async function fetchUser() {
  loading.value = true
  try {
    const result = await getPictureListPage({
      current: 1,
      pageSize: 1,
      userId: userId.value
    })

    if (result.code === 0 && result.data?.records?.length > 0) {
      const firstPic = result.data.records[0]
      user.value = firstPic.user
      totalItems.value = result.data.total || 0
    } else if (result.code === 0 && result.data?.total === 0) {
      totalItems.value = 0
    }
  } catch (error) {
    // 静默处理
  } finally {
    loading.value = false
  }
}

// 获取图片列表
async function fetchPictures(page = 1, append = false) {
  if (append) isLoadingMore.value = true

  try {
    const result = await getPictureListPage({
      current: page,
      pageSize: pageSize.value,
      userId: userId.value
    })

    if (result.code === 0) {
      const newPictures = (result.data?.records || []).map(pic => ({
        ...pic,
        loaded: false
      }))

      if (append) {
        pictures.value.push(...newPictures)
      } else {
        pictures.value = newPictures
      }

      totalItems.value = result.data?.total || 0
      currentPage.value = page

      if (!user.value && newPictures.length > 0) {
        user.value = newPictures[0].user
      }
    }
  } catch (error) {
    // 静默处理
  } finally {
    isLoadingMore.value = false
  }
}

// 加载更多 (按钮点击)
function loadMore() {
  if (hasMore.value && !isLoadingMore.value) {
    hasClickedLoadMore.value = true  // 标记已点击过
    fetchPictures(currentPage.value + 1, true)
  }
}

// 自动加载更多 (滚动到底部)
function autoLoadMore() {
  if (hasMore.value && !isLoadingMore.value && hasClickedLoadMore.value) {
    fetchPictures(currentPage.value + 1, true)
  }
}

// 设置 Intersection Observer 监听滚动
function setupScrollObserver() {
  // 创建一个哨兵元素用于检测滚动到底部
  const sentinel = document.createElement('div')
  sentinel.className = 'scroll-sentinel'
  sentinel.style.height = '100px'
  pageRef.value?.appendChild(sentinel)

  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          autoLoadMore()
        }
      })
    },
    {
      rootMargin: '200px',  // 提前 200px 开始加载
      threshold: 0.01
    }
  )

  observer.value.observe(sentinel)
}

// 打开图片详情
function openPicture(id) {
  router.push(`/picture/${id}`)
}

// 返回
function goBack() {
  router.back()
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '未知'
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`
}

// 监听路由参数变化
watch(() => route.params.userId, (newId) => {
  if (newId) {
    // 重置状态
    user.value = null
    pictures.value = []
    currentPage.value = 1
    hasClickedLoadMore.value = false

    // 清理旧的 observer
    if (observer.value) {
      observer.value.disconnect()
      observer.value = null
    }

    // 移除旧的哨兵元素
    const oldSentinel = pageRef.value?.querySelector('.scroll-sentinel')
    if (oldSentinel) oldSentinel.remove()

    fetchUser()
    fetchPictures(1)
  }
}, { immediate: true })

// 组件挂载后设置滚动监听
onMounted(() => {
  setupScrollObserver()
})

// 组件卸载前清理
onBeforeUnmount(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600&display=swap');

/* ========== 页面容器 ========== */
.user-detail-page {
  min-height: 100vh;
  position: relative;
  padding: 0 0 40px;
  overflow-x: hidden;
}

/* ========== 背景装饰 ========== */
.background-fx {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
}

.orb-1 {
  width: 500px;
  height: 500px;
  top: -150px;
  right: -150px;
  background: radial-gradient(circle, rgba(0, 240, 255, 0.4) 0%, transparent 70%);
  animation: orbFloat1 20s ease-in-out infinite;
}

.orb-2 {
  width: 400px;
  height: 400px;
  bottom: -100px;
  left: -100px;
  background: radial-gradient(circle, rgba(255, 61, 0, 0.3) 0%, transparent 70%);
  animation: orbFloat2 25s ease-in-out infinite;
}

@keyframes orbFloat1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-30px, 30px) scale(1.1); }
}

@keyframes orbFloat2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -20px) scale(1.05); }
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* ========== 主内容 ========== */
.main-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* ========== 顶部导航 ========== */
.page-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 20px 0;
  background: linear-gradient(180deg, rgba(10, 10, 46, 0.9) 0%, transparent 100%);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(0, 240, 255, 0.1);
  border-color: rgba(0, 240, 255, 0.3);
  transform: translateX(-4px);
}

/* ========== 加载状态 ========== */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 20px;
}

.spinner-ring {
  width: 50px;
  height: 50px;
  border: 3px solid transparent;
  border-top-color: #00F0FF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 2px solid transparent;
  border-top-color: #00F0FF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
}

/* ========== 用户信息卡片 ========== */
.profile-card {
  position: relative;
  background: rgba(15, 15, 25, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 32px;
  margin-bottom: 32px;
  overflow: hidden;
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.profile-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 30%, rgba(0, 240, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(255, 61, 0, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.profile-header {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  position: relative;
  z-index: 1;
}

.avatar-container {
  position: relative;
  flex-shrink: 0;
}

.avatar-image,
.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 24px;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00F0FF, #9333EA);
  color: #0a0a0a;
  font-family: 'Orbitron', sans-serif;
  font-size: 36px;
  font-weight: 700;
}

.avatar-ring {
  position: absolute;
  inset: -4px;
  border-radius: 28px;
  border: 2px solid transparent;
  background: linear-gradient(135deg, #00F0FF, #9333EA, #FF3D00) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: ringRotate 4s linear infinite;
}

@keyframes ringRotate {
  to { transform: rotate(360deg); }
}

.profile-info {
  flex: 1;
}

.user-name {
  font-family: 'Orbitron', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}

.user-bio {
  color: rgba(255, 255, 255, 0.6);
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.user-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
}

.role-badge {
  background: rgba(147, 51, 234, 0.2);
  color: #d8b4fe;
  border: 1px solid rgba(147, 51, 234, 0.3);
}

.role-badge.admin {
  background: rgba(255, 61, 0, 0.2);
  color: #ffa07a;
  border-color: rgba(255, 61, 0, 0.3);
}

.join-date {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* ========== 统计数据 ========== */
.stats-row {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-family: 'Orbitron', sans-serif;
  font-size: 48px;
  font-weight: 700;
  background: linear-gradient(135deg, #00F0FF, #9333EA);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  display: block;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

/* ========== 图片作品区域 ========== */
.gallery-section {
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Orbitron', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.section-title svg {
  color: #00F0FF;
}

.picture-count {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

/* ========== 图片网格 ========== */
.picture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.picture-card {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  animation: fadeInUp 0.5s ease both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease, opacity 0.3s ease;
  opacity: 0;
}

.card-image.loaded {
  opacity: 1;
}

.card-skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
  background-size: 200% 100%;
  animation: skeletonShimmer 1.5s infinite;
}

@keyframes skeletonShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(10, 10, 46, 0.95) 0%, transparent 60%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 16px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.picture-card:hover .card-image {
  transform: scale(1.08);
}

.picture-card:hover .card-overlay {
  opacity: 1;
}

.card-title {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: white;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

/* ========== 空状态 ========== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.3);
}

.empty-state svg {
  margin-bottom: 16px;
}

.empty-state p {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
}

/* ========== 加载更多按钮 ========== */
.load-more-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.load-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 14px;
  color: #00F0FF;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.load-more-btn:hover {
  background: rgba(0, 240, 255, 0.2);
  border-color: rgba(0, 240, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 240, 255, 0.2);
}

.load-more-btn.loading {
  opacity: 0.7;
  cursor: wait;
}

.spin {
  animation: spin 1s linear infinite;
}

/* ========== 自动加载状态 ========== */
.loading-more-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
}

.loading-more-text {
  color: rgba(255, 255, 255, 0.4);
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
}

/* ========== 没有更多 ========== */
.no-more-wrapper {
  text-align: center;
  margin-top: 32px;
  padding-bottom: 20px;
}

.no-more-text {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.3);
}

/* ========== 错误状态 ========== */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 20px;
  color: rgba(255, 255, 255, 0.3);
}

.error-back-btn {
  margin-top: 16px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.error-back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .user-meta {
    justify-content: center;
  }

  .picture-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .stat-value {
    font-size: 36px;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
