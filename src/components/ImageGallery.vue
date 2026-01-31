<template>
  <div class="gallery-container">
    <!-- 顶部筛选区 -->
    <div class="gallery-filters">
      <div class="filter-tabs">
        <button
          v-for="cat in categories"
          :key="cat.key"
          class="filter-tab"
          :class="{ active: activeCategory === cat.key }"
          @click="activeCategory = cat.key"
        >
          <component :is="cat.icon" class="tab-icon" />
          <span>{{ cat.label }}</span>
        </button>
      </div>

      <div class="filter-right">
        <!-- 视图切换按钮 -->
        <div class="view-toggle">
          <button
            class="view-btn"
            :class="{ active: viewMode === 'grid' }"
            @click="setViewMode('grid')"
            title="统一卡片"
          >
            <Grid3x3 class="view-icon" />
          </button>
          <button
            class="view-btn"
            :class="{ active: viewMode === 'masonry' }"
            @click="setViewMode('masonry')"
            title="瀑布流"
          >
            <LayoutTemplate class="view-icon" />
          </button>
        </div>

        <div class="filter-search">
          <Search class="search-icon" />
          <input
            v-model="searchText"
            type="text"
            placeholder="搜索图片..."
            class="search-input"
            @input="handleSearch"
          />
        </div>
      </div>
    </div>

    <!-- 图片网格 - 统一卡片模式 -->
    <div v-if="viewMode === 'grid'" class="gallery-grid gallery-grid-uniform" ref="galleryRef">
      <div
        v-for="item in displayImages"
        :key="item.id"
        class="gallery-item gallery-item-uniform"
        @click="openDetail(item)"
      >
        <div class="image-wrapper">
          <img
            :data-src="item.url"
            :alt="item.name"
            class="gallery-image lazy-loading"
          />
        </div>
        <div class="item-overlay">
          <div class="item-info">
            <span class="item-title">{{ item.name }}</span>
            <span class="item-author">{{ item.user?.userName || '未知' }}</span>
          </div>
          <div class="item-stats">
            <Eye class="stat-icon" />
            <span>{{ formatCount(item.picSize) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片瀑布流 - 瀑布流模式 -->
    <div v-else class="gallery-grid gallery-grid-masonry" ref="galleryRef">
      <div
        v-for="item in displayImages"
        :key="item.id"
        class="gallery-item gallery-item-masonry"
        :style="{ '--aspect-ratio': getAspectRatio(item) }"
        @click="openDetail(item)"
      >
        <img
          :data-src="item.url"
          :alt="item.name"
          class="gallery-image lazy-loading"
        />
        <div class="item-overlay">
          <div class="item-info">
            <span class="item-title">{{ item.name }}</span>
            <span class="item-author">{{ item.user?.userName || '未知' }}</span>
          </div>
          <div class="item-stats">
            <Eye class="stat-icon" />
            <span>{{ formatCount(item.picSize) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="gallery-loading">
      <Loader2 class="spinner" />
      <span>加载中...</span>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore && !loading" class="gallery-more">
      <button class="load-more-btn" @click="loadMore">
        加载更多
      </button>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && displayImages.length === 0" class="gallery-empty">
      <ImageOff class="empty-icon" />
      <p>暂无图片</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search, Eye, Loader2, ImageOff, Grid3x3, LayoutTemplate,
  Sparkles, Camera, Mountain, User, Smile, Layers, Shapes, Monitor
} from 'lucide-vue-next'
import { getPictureListPage } from '@/config/api.js'
import { useLazyImage } from '@/composables/image-core'
import { getPendingSearchTag } from '@/composables/searchState.js'

// Router
const router = useRouter()

// Props
const props = defineProps({
  userId: String, // 可选：筛选特定用户的图片
  pageSize: {
    type: Number,
    default: 20
  }
})

// Refs
const galleryRef = ref(null)
const activeCategory = ref('all')
const searchText = ref('')
const images = ref([])
const loading = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)

// 视图模式：grid-统一卡片, masonry-瀑布流（默认）
const viewMode = ref(localStorage.getItem('galleryViewMode') || 'masonry')

// 初始化懒加载
const { observe, observeAll, cleanup: cleanupLazy } = useLazyImage({
  rootMargin: '200px',
  threshold: 0.01
})

// 图片观察器引用
const imageRefs = ref([])

// 固定分类配置
const categories = [
  { key: 'all', label: '全部', icon: Grid3x3 },
  { key: '二次元', label: '二次元', icon: Sparkles },
  { key: '写实', label: '写实', icon: Camera },
  { key: '风景', label: '风景', icon: Mountain },
  { key: '人像', label: '人像', icon: User },
  { key: '表情包', label: '表情包', icon: Smile },
  { key: '壁纸', label: '壁纸', icon: Monitor },
  { key: '素材', label: '素材', icon: Layers },
  { key: '抽象', label: '抽象', icon: Shapes },
]

// 切换视图模式
const setViewMode = async (mode) => {
  viewMode.value = mode
  localStorage.setItem('galleryViewMode', mode)
  // 等待 DOM 更新后重新观察图片
  await nextTick()
  observeImages()
}

// 计算属性
const displayImages = computed(() => {
  let filtered = images.value

  // 搜索筛选（仍然需要前端搜索）
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    filtered = filtered.filter(img =>
      img.name?.toLowerCase().includes(keyword) ||
      img.introduction?.toLowerCase().includes(keyword) ||
      img.tags?.some(tag => tag.toLowerCase().includes(keyword))
    )
  }

  return filtered
})

// 点击图片跳转到详情页
const openDetail = (item) => {
  router.push(`/picture/${item.id}`)
}

// 方法
const getAspectRatio = (item) => {
  if (item.picWidth && item.picHeight) {
    return item.picWidth / item.picHeight
  }
  return 1 // 默认正方形
}

const formatCount = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 加载图片列表
const loadImages = async (page = 1, append = false) => {
  if (loading.value) return

  loading.value = true
  try {
    const query = {
      current: page,
      pageSize: props.pageSize
    }

    // 按分类筛选（后端筛选）
    if (activeCategory.value !== 'all') {
      query.category = activeCategory.value
    }

    // 如果指定了用户ID，筛选该用户的图片
    if (props.userId) {
      query.userId = props.userId
    }

    const result = await getPictureListPage(query)

    if (result.code === 0 && result.data) {
      const newImages = result.data.records || []

      if (append) {
        images.value = [...images.value, ...newImages]
      } else {
        images.value = newImages
      }

      hasMore.value = newImages.length === props.pageSize
      currentPage.value = page

      // 等待 DOM 更新后观察新图片
      await nextTick()
      observeImages()
    }
  } catch (error) {
    // 静默处理错误
  } finally {
    loading.value = false
  }
}

// 观察所有图片
const observeImages = () => {
  const images = document.querySelectorAll('.gallery-image[data-src]')
  observeAll(images)
}

const loadMore = () => {
  if (hasMore.value && !loading.value) {
    loadImages(currentPage.value + 1, true)
  }
}

// 搜索防抖
let searchTimeout = null
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    // 搜索时重置到第一页
    loadImages(1, false)
  }, 500)
}

// 滚动加载更多
const handleScroll = () => {
  if (!galleryRef.value) return

  const { scrollTop, scrollHeight, clientHeight } = document.documentElement
  const threshold = 300

  if (scrollTop + clientHeight >= scrollHeight - threshold) {
    loadMore()
  }
}

// 监听分类变化
watch(activeCategory, () => {
  // 切换分类时重新加载
  loadImages(1, false)
})

// 生命周期
onMounted(() => {
  // 检查是否有待搜索的标签（从详情页点击标签跳转过来）
  const pendingTag = getPendingSearchTag()
  if (pendingTag) {
    searchText.value = pendingTag
  }

  loadImages(1, false)
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  clearTimeout(searchTimeout)
  cleanupLazy()
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
}

/* ========== 容器 ========== */
.gallery-container {
  min-height: 100vh;
  padding: 20px;
}

/* ========== 筛选区 ========== */
.gallery-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 24px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-icon {
  width: 16px;
  height: 16px;
}

.filter-tab:hover {
  background: rgba(255, 255, 255, 0.06);
  color: white;
}

.filter-tab.active {
  color: var(--electric);
  background: rgba(0, 240, 255, 0.1);
  border-color: rgba(0, 240, 255, 0.3);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* ========== 视图切换按钮 ========== */
.view-toggle {
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 4px;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.view-btn.active {
  background: rgba(0, 240, 255, 0.15);
}

.view-btn.active .view-icon {
  color: var(--electric);
}

.view-icon {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.3s ease;
}

/* ========== 搜索框 ========== */
.filter-search {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  min-width: 280px;
}

.search-icon {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.4);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: white;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

/* ========== 统一卡片模式 ========== */
.gallery-grid-uniform {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.gallery-item-uniform {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  background: var(--void-lighter);
  aspect-ratio: 4/3;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.gallery-item-uniform:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 0 30px rgba(0, 240, 255, 0.1);
}

.gallery-item-uniform .image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--void-lighter);
  overflow: hidden;
}

.gallery-item-uniform .gallery-image {
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.gallery-item-uniform:hover .gallery-image {
  transform: scale(1.1);
}

/* ========== 瀑布流模式 ========== */
.gallery-grid-masonry {
  column-count: 4;
  column-gap: 16px;
  margin-bottom: 32px;
}

.gallery-item-masonry {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  background: var(--void-lighter);
  margin-bottom: 16px;
  break-inside: avoid;
  aspect-ratio: var(--aspect-ratio, 1);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.gallery-item-masonry:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 0 30px rgba(0, 240, 255, 0.1);
}

.gallery-item-masonry .gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  display: block;
}

.gallery-item-masonry:hover .gallery-image {
  transform: scale(1.1);
}

/* ========== 覆盖层（通用） ========== */
.item-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(0, 0, 0, 0.4) 40%,
    transparent 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.gallery-item-uniform:hover .item-overlay,
.gallery-item-masonry:hover .item-overlay {
  opacity: 1;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-title {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-author {
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.item-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.stat-icon {
  width: 16px;
  height: 16px;
}

/* ========== 加载状态 ========== */
.gallery-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 48px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.spinner {
  width: 32px;
  height: 32px;
  color: var(--electric);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========== 加载更多 ========== */
.gallery-more {
  display: flex;
  justify-content: center;
  padding: 24px;
}

.load-more-btn {
  padding: 12px 32px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--electric);
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.load-more-btn:hover {
  background: rgba(0, 240, 255, 0.2);
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.3);
}

/* ========== 空状态 ========== */
.gallery-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 24px;
  font-family: 'Exo 2', sans-serif;
  color: rgba(255, 255, 255, 0.4);
}

/* ========== 懒加载样式 ========== */
.gallery-image.lazy-loading {
  opacity: 0.5;
  filter: blur(10px);
  transform: scale(0.95);
  transition: opacity 0.4s ease, filter 0.4s ease, transform 0.4s ease;
}

.gallery-image.lazy-loaded {
  opacity: 1;
  filter: blur(0);
  transform: scale(1);
}

.gallery-image.lazy-error {
  opacity: 0.3;
  background: repeating-linear-gradient(
    45deg,
    var(--void-lighter),
    var(--void-lighter) 10px,
    #1a1a1a 10px,
    #1a1a1a 20px
  );
}

.empty-icon {
  width: 64px;
  height: 64px;
  opacity: 0.5;
}

/* ========== 响应式 ========== */
@media (max-width: 1400px) {
  .gallery-grid-masonry {
    column-count: 3;
  }
}

@media (max-width: 1024px) {
  .gallery-grid-masonry {
    column-count: 2;
  }
}

@media (max-width: 768px) {
  .gallery-filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-tabs {
    justify-content: center;
  }

  .filter-right {
    justify-content: center;
  }

  .filter-search {
    min-width: 100%;
  }

  .gallery-grid-uniform {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }

  .gallery-grid-masonry {
    column-count: 2;
    column-gap: 12px;
  }

  .gallery-item-masonry {
    margin-bottom: 12px;
  }
}

@media (max-width: 480px) {
  .gallery-grid-uniform {
    grid-template-columns: repeat(2, 1fr);
  }

  .gallery-grid-masonry {
    column-count: 1;
  }
}
</style>
