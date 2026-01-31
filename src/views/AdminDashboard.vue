<template>
  <div class="admin-dashboard">
    <!-- 权限检查 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-ring">
        <div class="ring-segment"></div>
        <div class="ring-segment"></div>
        <div class="ring-segment"></div>
      </div>
      <p class="loading-text">验证权限中...</p>
    </div>

    <div v-else-if="!isAdmin" class="access-denied">
      <ShieldAlert class="denied-icon" />
      <h1 class="denied-title">访问受限</h1>
      <p class="denied-text">您没有权限访问管理后台</p>
      <button class="back-btn" @click="$router.push('/')">
        <ArrowLeft class="btn-icon" />
        返回首页
      </button>
    </div>

    <template v-else>
      <!-- 页面头部 -->
      <header class="dashboard-header">
        <div class="header-content">
          <div class="header-left">
            <div class="header-badge">
              <Shield class="badge-icon" />
              <span>ADMIN</span>
            </div>
            <div>
              <h1 class="header-title">指挥中心</h1>
              <p class="header-subtitle">图片审核与内容管理</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="action-btn" @click="refreshData" title="刷新数据">
              <RefreshCw :class="{ spinning: isRefreshing }" class="btn-icon" />
            </button>
          </div>
        </div>
      </header>

      <!-- 统计面板 -->
      <section class="stats-section">
        <div class="stat-card stat-pending">
          <div class="stat-icon-wrapper">
            <Clock class="stat-icon" />
          </div>
          <div class="stat-content">
            <p class="stat-label">待审核</p>
            <p class="stat-value">{{ stats.pending }}</p>
          </div>
        </div>
        <div class="stat-card stat-approved">
          <div class="stat-icon-wrapper">
            <Check class="stat-icon" />
          </div>
          <div class="stat-content">
            <p class="stat-label">已通过</p>
            <p class="stat-value">{{ stats.pass }}</p>
          </div>
        </div>
        <div class="stat-card stat-rejected">
          <div class="stat-icon-wrapper">
            <X class="stat-icon" />
          </div>
          <div class="stat-content">
            <p class="stat-label">已拒绝</p>
            <p class="stat-value">{{ stats.reject }}</p>
          </div>
        </div>
        <div class="stat-card stat-total">
          <div class="stat-icon-wrapper">
            <Database class="stat-icon" />
          </div>
          <div class="stat-content">
            <p class="stat-label">总图片</p>
            <p class="stat-value">{{ stats.total }}</p>
          </div>
        </div>
      </section>

      <!-- 主内容区 -->
      <div class="main-content">
        <!-- 左侧：审核列表 -->
        <section class="review-section">
          <!-- 筛选栏 -->
          <div class="section-header">
            <div class="filter-tabs">
              <button
                v-for="tab in reviewTabs"
                :key="tab.key"
                class="filter-tab"
                :class="{ active: activeTab === tab.key }"
                @click="setActiveTab(tab.key)"
              >
                <component :is="tab.icon" class="tab-icon" />
                <span>{{ tab.label }}</span>
                <span class="tab-count">{{ tab.count }}</span>
              </button>
            </div>
            <div class="batch-actions" v-if="selectedIds.length > 0">
              <button class="batch-btn batch-approve" @click="batchApprove">
                <Check class="btn-icon" />
                通过 ({{ selectedIds.length }})
              </button>
              <button class="batch-btn batch-reject" @click="batchReject">
                <X class="btn-icon" />
                拒绝
              </button>
            </div>
          </div>

          <!-- 图片列表 - 单列卡片 -->
          <div class="review-list">
            <!-- 列表头部：全选 -->
            <div class="list-header" v-if="reviewList.length > 0">
              <label class="header-checkbox">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                  class="checkbox-input"
                />
                <span class="checkbox-custom"></span>
                <span class="select-text">
                  {{ isAllSelected ? '取消全选' : '全选' }}
                </span>
              </label>
              <span class="header-info">已选 {{ selectedIds.length }} / {{ reviewList.length }}</span>
            </div>

            <!-- 加载状态 -->
            <div v-if="loadingList" class="loading-list">
              <div class="loading-skeleton-card" v-for="i in 8" :key="i">
                <div class="skeleton-thumb"></div>
                <div class="skeleton-content">
                  <div class="skeleton-line skeleton-title"></div>
                  <div class="skeleton-line skeleton-meta"></div>
                  <div class="skeleton-line skeleton-meta-short"></div>
                </div>
              </div>
            </div>

            <!-- 图片卡片 -->
            <div
              v-for="item in reviewList"
              :key="item.id"
              class="review-card"
              :class="{ selected: selectedIds.includes(item.id) }"
            >
              <!-- 选择框 -->
              <label class="card-checkbox">
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(item.id)"
                  @change="toggleSelect(item.id)"
                  class="checkbox-input"
                />
                <span class="checkbox-custom"></span>
              </label>

              <!-- 缩略图 -->
              <div class="card-thumb" @click="previewImage(item)">
                <img :src="item.url" :alt="item.name" class="thumb-image" loading="lazy" />
                <div class="thumb-overlay">
                  <Eye class="overlay-icon" />
                </div>
                <span class="status-badge" :class="`status-${item.reviewStatus}`">
                  {{ getStatusLabel(item.reviewStatus) }}
                </span>
              </div>

              <!-- 信息区 -->
              <div class="card-info">
                <h3 class="card-name" :title="item.name">{{ item.name }}</h3>
                <div class="card-meta">
                  <span class="meta-item">
                    <FileImage class="meta-icon" />
                    {{ item.picWidth }}×{{ item.picHeight }}
                  </span>
                  <span class="meta-item">
                    <Tag class="meta-icon" />
                    {{ item.category || '未分类' }}
                  </span>
                  <span class="meta-item">
                    <Calendar class="meta-icon" />
                    {{ formatDate(item.createTime) }}
                  </span>
                </div>
                <div class="card-tags" v-if="item.tags?.length">
                  <span v-for="tag in item.tags.slice(0, 4)" :key="tag" class="tag">#{{ tag }}</span>
                  <span v-if="item.tags.length > 4" class="tag-more">+{{ item.tags.length - 4 }}</span>
                </div>
                <p class="card-intro" v-if="item.introduction">{{ item.introduction }}</p>
              </div>

              <!-- 上传者信息 -->
              <div class="card-uploader">
                <div class="uploader-avatar" :title="item.user?.userName || '未知用户'">
                  <img
                    v-if="item.user?.userAvatar"
                    :src="item.user.userAvatar"
                    :alt="item.user.userName"
                    class="avatar-image"
                  />
                  <User v-else class="avatar-placeholder" />
                </div>
                <div class="uploader-info">
                  <p class="uploader-name">{{ item.user?.userName || '未知用户' }}</p>
                  <p class="uploader-email" v-if="item.user?.email">{{ maskEmail(item.user.email) }}</p>
                </div>
              </div>

              <!-- 操作区 -->
              <div class="card-actions">
                <button class="action-btn approve" @click="approveItem(item.id)" title="通过">
                  <Check class="icon" />
                </button>
                <button class="action-btn reject" @click="rejectItem(item.id)" title="拒绝">
                  <X class="icon" />
                </button>
                <button class="action-btn delete" @click="deleteItem(item.id)" title="删除">
                  <Trash2 class="icon" />
                </button>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="!loadingList && reviewList.length === 0" class="empty-state">
              <Inbox class="empty-icon" />
              <p class="empty-text">{{ emptyText }}</p>
            </div>
          </div>

          <!-- 分页控制 -->
          <div class="pagination" v-if="totalPages > 1">
            <button
              class="page-btn prev"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              <ChevronLeft class="page-icon" />
              上一页
            </button>
            <div class="page-numbers">
              <button
                v-for="page in visiblePages"
                :key="page"
                class="page-number"
                :class="{ active: page === currentPage, ellipsis: page === '...' }"
                :disabled="page === '...'"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
            </div>
            <button
              class="page-btn next"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            >
              下一页
              <ChevronRight class="page-icon" />
            </button>
          </div>

          <!-- 分页信息 -->
          <div class="pagination-info" v-if="totalItems > 0">
            共 {{ totalItems }} 项 · 第 {{ currentPage }} / {{ totalPages }} 页
          </div>
        </section>

        <!-- 右侧：批量抓取 -->
        <aside class="sidebar">
          <div class="sidebar-card">
            <div class="card-header">
              <h2 class="card-title">
                <Globe class="title-icon" />
                批量抓取
              </h2>
            </div>

            <div class="fetch-form">
              <div class="form-group">
                <label class="form-label">搜索关键词 *</label>
                <input
                  v-model="batchFetch.searchText"
                  type="text"
                  class="form-input"
                  placeholder="输入搜索关键词"
                  :disabled="isFetching"
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">数量</label>
                  <input
                    v-model.number="batchFetch.count"
                    type="number"
                    class="form-input"
                    min="1"
                    max="100"
                    :disabled="isFetching"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">分类</label>
                  <select v-model="batchFetch.category" class="form-select" :disabled="isFetching">
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
                <label class="form-label">前缀名</label>
                <input
                  v-model="batchFetch.preFixName"
                  type="text"
                  class="form-input"
                  placeholder="图片名称前缀"
                  :disabled="isFetching"
                />
              </div>

              <div class="form-group">
                <label class="form-label">标签</label>
                <div class="tags-input-wrapper">
                  <input
                    v-model="tagInput"
                    class="tags-input"
                    placeholder="输入标签后按回车添加"
                    @keydown.enter.prevent="addTag"
                    :disabled="isFetching"
                  />
                  <div class="tags-list">
                    <span
                      v-for="(tag, index) in batchFetch.tags"
                      :key="index"
                      class="tag-item"
                    >
                      {{ tag }}
                      <button
                        @click="removeTag(index)"
                        class="tag-remove"
                        :disabled="isFetching"
                      >
                        <X class="tag-remove-icon" />
                      </button>
                    </span>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">介绍</label>
                <textarea
                  v-model="batchFetch.introduction"
                  class="form-textarea"
                  placeholder="图片介绍描述"
                  rows="2"
                  :disabled="isFetching"
                ></textarea>
              </div>

              <div class="fetch-actions">
                <button
                  class="fetch-btn primary"
                  :disabled="isFetching || !batchFetch.searchText"
                  @click="handleBatchFetch"
                >
                  <Download v-if="!isFetching" class="btn-icon" />
                  <Loader2 v-else class="btn-icon spinning" />
                  {{ isFetching ? '抓取中...' : '开始抓取' }}
                </button>
                <button
                  v-if="!isFetching"
                  class="fetch-btn secondary"
                  @click="resetFetchForm"
                >
                  <RotateCcw class="btn-icon" />
                  重置
                </button>
              </div>
            </div>

            <!-- 抓取结果 -->
            <Transition name="result">
              <div v-if="showFetchResult && fetchResult" class="fetch-result">
                <div class="result-header">
                  <CheckCircle class="result-icon" />
                  <span class="result-count">成功抓取 {{ fetchResult.length }} 张</span>
                </div>
                <div class="result-grid">
                  <div
                    v-for="(item, index) in fetchResult.slice(0, 6)"
                    :key="item.id || index"
                    class="result-item"
                  >
                    <img :src="item.url" :alt="item.name" class="result-image" loading="lazy" />
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- 快捷操作 -->
          <div class="quick-actions">
            <button class="quick-btn" @click="$router.push('/')">
              <Home class="btn-icon" />
              返回首页
            </button>
          </div>
        </aside>
      </div>
    </template>

    <!-- 图片预览弹窗 -->
    <Transition name="preview">
      <div v-if="previewImageUrl" class="preview-modal" @click="previewImageUrl = null">
        <button class="preview-close" @click.stop="previewImageUrl = null">
          <X class="close-icon" />
        </button>
        <img :src="previewImageUrl" class="preview-image-full" @click.stop />
      </div>
    </Transition>

    <!-- 审核弹窗 -->
    <Transition name="review">
      <div v-if="showReviewModal" class="review-modal-backdrop" @click.self="closeReviewModal">
        <div class="review-modal">
          <!-- 弹窗头部 -->
          <div class="review-modal-header" :class="`modal-${reviewModalAction}`">
            <component :is="reviewModalAction === 'approve' ? Check : X" class="modal-icon" />
            <h2 class="modal-title">{{ reviewModalTitle }}</h2>
            <button class="modal-close" @click="closeReviewModal">
              <X class="close-icon" />
            </button>
          </div>

          <!-- 弹窗内容 -->
          <div class="review-modal-content">
            <p class="modal-subtitle" v-if="isBatchReview">
              您即将对 <span class="highlight">{{ reviewTargetIds.length }}</span> 张图片进行
              <span :class="`text-${reviewModalAction}`">{{ reviewModalAction === 'approve' ? '通过' : '拒绝' }}</span>
              操作
            </p>
            <p class="modal-subtitle" v-else>
              请输入审核意见（可选）
            </p>

            <div class="form-group">
              <label class="form-label">
                {{ reviewModalAction === 'approve' ? '通过说明' : '拒绝原因' }}
              </label>
              <textarea
                v-model="reviewMessage"
                class="review-textarea"
                :placeholder="reviewModalAction === 'approve' ? '请输入通过原因（可选）' : '请输入拒绝原因（可选）'"
                rows="4"
                @keydown.ctrl.enter="confirmReview"
                ref="reviewTextareaRef"
              ></textarea>
              <p class="char-count">{{ reviewMessage.length }} / 200</p>
            </div>

            <!-- 快捷选项 -->
            <div class="quick-options">
              <button
                v-for="option in quickReviewOptions"
                :key="option"
                class="quick-option-btn"
                @click="reviewMessage = option"
              >
                {{ option }}
              </button>
            </div>
          </div>

          <!-- 弹窗底部 -->
          <div class="review-modal-footer">
            <button class="modal-btn cancel" @click="closeReviewModal">
              取消
            </button>
            <button
              class="modal-btn"
              :class="reviewModalAction === 'approve' ? 'approve' : 'reject'"
              @click="confirmReview"
            >
              <component :is="reviewModalAction === 'approve' ? Check : X" class="btn-icon" />
              {{ reviewModalAction === 'approve' ? '确认通过' : '确认拒绝' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Shield, ShieldAlert, ArrowLeft, RefreshCw, Check, X, Trash2,
  Eye, Calendar, Tag, User, Inbox, Home,
  Loader2, Clock, FileImage, Database, Globe, Download, RotateCcw,
  ChevronLeft, ChevronRight, CheckCircle
} from 'lucide-vue-next'
import { getPictureListPage, deletePicture, fetchPicturesByBatch, getPicDatabaseInfo, doPictureReview } from '@/config/api.js'

const router = useRouter()

// 状态
const loading = ref(true)
const isAdmin = ref(false)
const isRefreshing = ref(false)

// 审核相关
const activeTab = ref('pending')
const reviewList = ref([])
const selectedIds = ref([])
const loadingList = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)

// 统计数据
const stats = ref({
  pending: '0',
  pass: '0',
  reject: '0',
  total: '0'
})

// 批量抓取相关
const batchFetch = ref({
  searchText: '',
  preFixName: '',
  count: 10,
  category: '',
  tags: [],
  introduction: ''
})
const isFetching = ref(false)
const fetchResult = ref(null)
const showFetchResult = ref(false)
// 标签输入相关
const tagInput = ref('')

// 预览
const previewImageUrl = ref(null)

// 审核弹窗相关
const showReviewModal = ref(false)
const reviewModalAction = ref('approve') // 'approve' | 'reject'
const reviewTargetIds = ref([])
const reviewMessage = ref('')
const reviewConfirmCallback = ref(null)
const reviewTextareaRef = ref(null)

// 计算属性
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

const isAllSelected = computed(() => {
  return reviewList.value.length > 0 && selectedIds.value.length === reviewList.value.length
})

const isBatchReview = computed(() => reviewTargetIds.value.length > 1)

const reviewModalTitle = computed(() => {
  const count = reviewTargetIds.value.length
  const action = reviewModalAction.value === 'approve' ? '通过' : '拒绝'
  return count > 1 ? `${count} 张图片 - ${action}` : action
})

const quickReviewOptions = computed(() => {
  if (reviewModalAction.value === 'approve') {
    return ['内容符合规范', '图片质量良好', '分类正确']
  } else {
    return ['内容违规', '图片模糊', '分类错误', '重复内容']
  }
})

const emptyText = computed(() => {
  const texts = {
    pending: '暂无待审核图片',
    approved: '暂无已通过图片',
    rejected: '暂无已拒绝图片',
    all: '暂无图片'
  }
  return texts[activeTab.value] || '暂无数据'
})

// 审核标签
const reviewTabs = computed(() => [
  { key: 'pending', label: '待审核', icon: Clock, count: stats.value.pending },
  { key: 'approved', label: '已通过', icon: Check, count: stats.value.pass },
  { key: 'rejected', label: '已拒绝', icon: X, count: stats.value.reject },
  { key: 'all', label: '全部', icon: FileImage, count: stats.value.total },
])

// 分页显示的页码
const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }

  return pages
})

// 获取当前用户
async function fetchCurrentUser() {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8123/api'}/user/current`, {
      credentials: 'include'
    })
    const result = await response.json()
    if (result.code === 0 && result.data) {
      isAdmin.value = result.data.userRole === 'admin'
    }
  } catch (error) {
    // 静默处理错误
  } finally {
    loading.value = false
  }

  if (!isAdmin.value) return

  await Promise.all([
    fetchStats(),
    fetchReviewList()
  ])
}

// 获取统计数据（使用新接口）
async function fetchStats() {
  try {
    const result = await getPicDatabaseInfo()
    if (result.code === 0 && result.data) {
      stats.value.pending = formatNumber(result.data.reviewingCount || 0)
      stats.value.pass = formatNumber(result.data.passCount || 0)
      stats.value.reject = formatNumber(result.data.rejectCount || 0)
      stats.value.total = formatNumber(result.data.allPicCount || 0)
    }
  } catch (error) {
    // 静默处理错误
  }
}

// 获取审核列表
async function fetchReviewList() {
  loadingList.value = true
  try {
    const query = {
      current: currentPage.value,
      pageSize: pageSize.value
    }

    if (activeTab.value === 'pending') query.reviewStatus = 0
    else if (activeTab.value === 'approved') query.reviewStatus = 1
    else if (activeTab.value === 'rejected') query.reviewStatus = 2

    const result = await getPictureListPage(query)
    if (result.code === 0 && result.data) {
      reviewList.value = result.data.records || []
      totalItems.value = result.data.total || 0
    }
  } catch (error) {
    // 静默处理错误
  } finally {
    loadingList.value = false
  }
}

// 切换标签
async function setActiveTab(tab) {
  activeTab.value = tab
  selectedIds.value = []
  currentPage.value = 1
  await fetchReviewList()
}

// 刷新数据
async function refreshData() {
  isRefreshing.value = true
  selectedIds.value = []
  await Promise.all([
    fetchStats(),
    fetchReviewList()
  ])
  setTimeout(() => {
    isRefreshing.value = false
  }, 500)
}

// 分页跳转
async function goToPage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page
  selectedIds.value = []
  await fetchReviewList()
}

// 全选/取消全选
function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = reviewList.value.map(item => item.id)
  }
}

// 选择/取消选择
function toggleSelect(id) {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

// 通过单个（使用新审核接口）
function approveItem(id) {
  openReviewModal([id], 'approve')
}

// 拒绝单个（使用新审核接口）
function rejectItem(id) {
  openReviewModal([id], 'reject')
}

// 打开审核弹窗
function openReviewModal(ids, action) {
  reviewTargetIds.value = ids
  reviewModalAction.value = action
  reviewMessage.value = ''
  showReviewModal.value = true

  // 聚焦到输入框
  setTimeout(() => {
    reviewTextareaRef.value?.focus()
  }, 100)
}

// 关闭审核弹窗
function closeReviewModal() {
  showReviewModal.value = false
  reviewTargetIds.value = []
  reviewMessage.value = ''
  reviewConfirmCallback.value = null
}

// 确认审核
async function confirmReview() {
  const ids = reviewTargetIds.value
  const action = reviewModalAction.value
  const message = reviewMessage.value.trim() || (action === 'approve' ? '审核通过' : '未通过审核')
  const status = action === 'approve' ? 1 : 2

  try {
    // 执行审核操作
    await Promise.all(ids.map(id =>
      doPictureReview({ id, reviewStatus: status, reviewMessage: message })
    ))

    // 更新列表
    reviewList.value = reviewList.value.filter(item => !ids.includes(item.id))
    selectedIds.value = selectedIds.value.filter(sid => !ids.includes(sid))

    // 刷新统计
    await fetchStats()

    // 处理分页
    if (reviewList.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
      await fetchReviewList()
    }

    closeReviewModal()
  } catch (error) {
    // 静默处理错误
  }
}

// 删除
async function deleteItem(id) {
  if (!confirm('确定要删除这张图片吗？')) return
  try {
    await deletePicture(id)
    reviewList.value = reviewList.value.filter(item => item.id !== id)
    selectedIds.value = selectedIds.value.filter(sid => sid !== id)
    await fetchStats()
    if (reviewList.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
      await fetchReviewList()
    }
  } catch (error) {
    // 静默处理错误
  }
}

// 批量通过（使用新审核接口）
function batchApprove() {
  if (selectedIds.value.length === 0) return
  openReviewModal([...selectedIds.value], 'approve')
}

// 批量拒绝（使用新审核接口）
function batchReject() {
  if (selectedIds.value.length === 0) return
  openReviewModal([...selectedIds.value], 'reject')
}

// 批量抓取图片
async function handleBatchFetch() {
  if (isFetching.value) return

  isFetching.value = true
  fetchResult.value = null
  showFetchResult.value = false

  try {
    const params = {
      searchText: batchFetch.value.searchText,
      preFixName: batchFetch.value.preFixName,
      count: batchFetch.value.count || 10,
      category: batchFetch.value.category,
      tags: batchFetch.value.tags,
      introduction: batchFetch.value.introduction
    }

    const result = await fetchPicturesByBatch(params)
    if (result.code === 0) {
      fetchResult.value = result.data || []
      showFetchResult.value = true
      await fetchStats()
      await fetchReviewList()
    } else {
      alert(result.message || '抓取失败')
    }
  } catch (error) {
    alert('抓取失败: ' + error.message)
  } finally {
    isFetching.value = false
  }
}

// 重置抓取表单
function resetFetchForm() {
  batchFetch.value = {
    searchText: '',
    preFixName: '',
    count: 10,
    category: '',
    tags: [],
    introduction: ''
  }
  tagInput.value = ''
  fetchResult.value = null
  showFetchResult.value = false
}

// 添加标签
function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !batchFetch.value.tags.includes(tag)) {
    batchFetch.value.tags.push(tag)
    tagInput.value = ''
  }
}

// 删除标签
function removeTag(index) {
  batchFetch.value.tags.splice(index, 1)
}

// 预览图片
function previewImage(item) {
  previewImageUrl.value = item.url
}

// 工具函数
function getStatusLabel(status) {
  const labels = { 0: '待审核', 1: '已通过', 2: '已拒绝' }
  return labels[status] || '未知'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / 86400000)

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function formatNumber(num) {
  if (!num) return '0'
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

function maskEmail(email) {
  if (!email) return ''
  const [name, domain] = email.split('@')
  if (name.length <= 2) return email
  return name.slice(0, 2) + '***@' + domain
}

// 生命周期
onMounted(() => {
  fetchCurrentUser()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;900&family=Rajdhani:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600;700&display=swap');

/* ========== 全局容器 ========== */
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #050508 0%, #0a0a12 50%, #050508 100%);
  position: relative;
  overflow-x: hidden;
}

/* 背景网格 */
.admin-dashboard::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 0;
}

/* 扫描线效果 */
.admin-dashboard::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.5), transparent);
  animation: scanline 4s linear infinite;
  pointer-events: none;
  z-index: 1;
}

@keyframes scanline {
  0% { top: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

/* ========== 加载状态 ========== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 24px;
}

.loading-ring {
  position: relative;
  width: 80px;
  height: 80px;
}

.ring-segment {
  position: absolute;
  inset: 0;
  border: 3px solid transparent;
  border-top-color: #00F0FF;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
}

.ring-segment:nth-child(1) { animation-delay: 0s; inset: 0; }
.ring-segment:nth-child(2) { animation-delay: 0.2s; inset: 8px; border-top-color: #FF3D00; }
.ring-segment:nth-child(3) { animation-delay: 0.4s; inset: 16px; border-top-color: #FFA500; }

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* ========== 访问拒绝 ========== */
.access-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 20px;
  text-align: center;
}

.denied-icon {
  width: 80px;
  height: 80px;
  color: #FF3D00;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

.denied-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0;
}

.denied-text {
  font-family: 'Exo 2', sans-serif;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 24px;
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 12px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #00F0FF;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(0, 240, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 240, 255, 0.3);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* ========== 页面头部 ========== */
.dashboard-header {
  position: relative;
  z-index: 2;
  padding: 20px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(5, 5, 8, 0.8);
  backdrop-filter: blur(20px);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: linear-gradient(135deg, rgba(255, 61, 0, 0.2), rgba(255, 61, 0, 0.1));
  border: 1px solid rgba(255, 61, 0, 0.3);
  border-radius: 10px;
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #FF3D00;
}

.badge-icon {
  width: 16px;
  height: 16px;
}

.header-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.header-subtitle {
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: 2px 0 0 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(0, 240, 255, 0.1);
  border-color: rgba(0, 240, 255, 0.3);
  color: #00F0FF;
}

.action-btn .btn-icon { width: 18px; height: 18px; }
.action-btn .btn-icon.spinning { animation: spin 1s linear infinite; }

/* ========== 统计面板 ========== */
.stats-section {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px 32px;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, currentColor, transparent);
  opacity: 0.5;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.stat-card.stat-pending { color: #FFA500; }
.stat-card.stat-approved { color: #00F0FF; }
.stat-card.stat-rejected { color: #FF3D00; }
.stat-card.stat-total { color: #9333EA; }

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.stat-icon { width: 24px; height: 24px; }

.stat-content { flex: 1; }

.stat-label {
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 2px 0;
}

.stat-value {
  font-family: 'Rajdhani', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1;
}

/* ========== 主内容区 ========== */
.main-content {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
  padding: 0 32px 32px;
  align-items: start;
}

/* ========== 审核区域 ========== */
.review-section {
  display: flex;
  flex-direction: column;
  background: rgba(15, 15, 25, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 18px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  gap: 12px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tab:hover {
  background: rgba(255, 255, 255, 0.06);
  color: white;
}

.filter-tab.active {
  background: rgba(0, 240, 255, 0.15);
  border-color: rgba(0, 240, 255, 0.3);
  color: #00F0FF;
}

.tab-icon { width: 14px; height: 14px; }

.tab-count {
  padding: 1px 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.batch-actions {
  display: flex;
  gap: 6px;
}

.batch-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.batch-btn .btn-icon { width: 14px; height: 14px; }

.batch-btn.batch-approve {
  background: rgba(0, 240, 255, 0.15);
  color: #00F0FF;
}

.batch-btn.batch-approve:hover {
  background: rgba(0, 240, 255, 0.25);
}

.batch-btn.batch-reject {
  background: rgba(255, 61, 0, 0.15);
  color: #FF3D00;
}

.batch-btn.batch-reject:hover {
  background: rgba(255, 61, 0, 0.25);
}

/* 审核列表 */
.review-list {
  padding: 12px;
  max-height: calc(100vh - 340px);
  overflow-y: auto;
  flex: 1;
}

.review-list::-webkit-scrollbar {
  width: 6px;
}

.review-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}

.review-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

/* 列表头部：全选 */
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  margin-bottom: 10px;
  background: rgba(0, 240, 255, 0.05);
  border: 1px solid rgba(0, 240, 255, 0.15);
  border-radius: 10px;
}

.header-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.select-text {
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #00F0FF;
}

.header-info {
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

/* 加载骨架屏 */
.loading-list {
  padding: 12px;
}

.loading-skeleton-card {
  display: flex;
  gap: 14px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 10px;
}

.skeleton-thumb {
  width: 120px;
  height: 90px;
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.02) 25%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.02) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.02) 25%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.02) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-title { width: 60%; }
.skeleton-meta { width: 40%; }
.skeleton-meta-short { width: 25%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 图片卡片 */
.review-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.review-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.review-card.selected {
  background: rgba(0, 240, 255, 0.08);
  border-color: rgba(0, 240, 255, 0.25);
}

.card-checkbox {
  cursor: pointer;
  flex-shrink: 0;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.checkbox-custom {
  display: block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-input:checked + .checkbox-custom {
  background: #00F0FF;
  border-color: #00F0FF;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.card-thumb {
  position: relative;
  width: 120px;
  height: 90px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
}

.thumb-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.review-card:hover .thumb-image {
  transform: scale(1.05);
}

.thumb-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card-thumb:hover .thumb-overlay {
  opacity: 1;
}

.overlay-icon {
  width: 24px;
  height: 24px;
  color: white;
}

.status-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 3px 8px;
  border-radius: 6px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.status-0 {
  background: rgba(255, 165, 0, 0.9);
  color: white;
}

.status-badge.status-1 {
  background: rgba(0, 240, 255, 0.9);
  color: white;
}

.status-badge.status-2 {
  background: rgba(255, 61, 0, 0.9);
  color: white;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: white;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.meta-icon { width: 12px; height: 12px; }

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.tag {
  padding: 3px 8px;
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.15);
  border-radius: 6px;
  font-family: 'Exo 2', sans-serif;
  font-size: 10px;
  color: #00F0FF;
}

.tag-more {
  padding: 3px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-family: 'Exo 2', sans-serif;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.card-intro {
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 上传者信息 */
.card-uploader {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  flex-shrink: 0;
  min-width: 140px;
}

.uploader-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(0, 240, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 20px;
  height: 20px;
  color: rgba(0, 240, 255, 0.5);
}

.uploader-info {
  flex: 1;
  min-width: 0;
}

.uploader-name {
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: white;
  margin: 0 0 2px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.uploader-email {
  font-family: 'Exo 2', sans-serif;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.card-actions .action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-actions .action-btn:hover {
  transform: scale(1.1);
}

.card-actions .action-btn.approve:hover {
  background: rgba(0, 240, 255, 0.2);
  border-color: rgba(0, 240, 255, 0.4);
  color: #00F0FF;
}

.card-actions .action-btn.reject:hover {
  background: rgba(255, 61, 0, 0.2);
  border-color: rgba(255, 61, 0, 0.4);
  color: #FF3D00;
}

.card-actions .action-btn.delete:hover {
  background: rgba(255, 61, 0, 0.2);
  border-color: rgba(255, 61, 0, 0.4);
  color: #FF3D00;
}

.card-actions .action-btn .icon { width: 16px; height: 16px; }

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-icon {
  width: 56px;
  height: 56px;
  color: rgba(255, 255, 255, 0.15);
  margin-bottom: 12px;
}

.empty-text {
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  flex-wrap: wrap;
}

.page-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: rgba(0, 240, 255, 0.1);
  border-color: rgba(0, 240, 255, 0.3);
  color: #00F0FF;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-icon { width: 16px; height: 16px; }

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-number:hover:not(.active):not(.ellipsis) {
  background: rgba(0, 240, 255, 0.1);
  border-color: rgba(0, 240, 255, 0.3);
  color: #00F0FF;
}

.page-number.active {
  background: linear-gradient(135deg, #00F0FF, #00C0FF);
  border-color: #00F0FF;
  color: #050508;
}

.page-number.ellipsis {
  border: none;
  background: none;
  cursor: default;
}

.pagination-info {
  text-align: center;
  padding: 8px 16px 12px;
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

/* ========== 侧边栏 ========== */
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-card {
  background: rgba(15, 15, 25, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 18px;
  padding: 18px;
}

.card-header {
  margin-bottom: 14px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.title-icon {
  width: 18px;
  height: 18px;
  color: #9333EA;
}

/* 批量抓取表单 */
.fetch-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input,
.form-select,
.form-textarea {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  color: white;
  transition: all 0.3s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: rgba(147, 51, 234, 0.5);
  background: rgba(147, 51, 234, 0.05);
}

.form-input:disabled,
.form-select:disabled,
.form-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-select { cursor: pointer; }
.form-select option { background: #1a1a2e; }

.form-textarea {
  resize: vertical;
  min-height: 50px;
}

/* 标签输入组件样式 */
.tags-input-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tags-input {
  width: 100%;
  padding: 10px 12px;
  padding-bottom: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  color: white;
  transition: all 0.3s ease;
}

.tags-input:focus {
  outline: none;
  border-color: rgba(147, 51, 234, 0.5);
  background: rgba(147, 51, 234, 0.05);
}

.tags-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tags-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 24px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(124, 58, 237, 0.2));
  border: 1px solid rgba(147, 51, 234, 0.4);
  border-radius: 6px;
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  color: #e9d5ff;
  animation: tagSlideIn 0.2s ease-out;
}

@keyframes tagSlideIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s ease;
}

.tag-remove:hover:not(:disabled) {
  background: rgba(255, 61, 0, 0.3);
  color: #ff6b6b;
}

.tag-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tag-remove-icon {
  width: 12px;
  height: 12px;
  stroke-width: 2.5;
}

.fetch-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.fetch-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.fetch-btn.primary {
  background: linear-gradient(135deg, #9333EA, #7C3AED);
  color: white;
}

.fetch-btn.primary:hover:not(:disabled) {
  box-shadow: 0 4px 20px rgba(147, 51, 234, 0.4);
  transform: translateY(-2px);
}

.fetch-btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fetch-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
}

.fetch-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* 抓取结果 */
.fetch-result {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.result-icon {
  width: 18px;
  height: 18px;
  color: #00F0FF;
}

.result-count {
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #00F0FF;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.result-item {
  aspect-ratio: 4/3;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
}

.result-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 结果动画 */
.result-enter-active,
.result-leave-active {
  transition: all 0.3s ease;
}

.result-enter-from,
.result-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  gap: 8px;
}

.quick-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: rgba(15, 15, 25, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-btn:hover {
  background: rgba(0, 240, 255, 0.1);
  border-color: rgba(0, 240, 255, 0.2);
  color: #00F0FF;
}

.quick-btn .btn-icon { width: 16px; height: 16px; }

/* ========== 图片预览 ========== */
.preview-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.95);
  cursor: zoom-out;
}

.preview-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
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

.preview-close:hover {
  background: #FF3D00;
  transform: rotate(90deg);
}

.close-icon { width: 22px; height: 22px; }

.preview-image-full {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
}

/* 动画 */
.preview-enter-active,
.preview-leave-active {
  transition: all 0.3s ease;
}

.preview-enter-from,
.preview-leave-to {
  opacity: 0;
}

.preview-enter-from .preview-image-full,
.preview-leave-to .preview-image-full {
  transform: scale(0.9);
}

/* ========== 审核弹窗 ========== */
.review-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  padding: 20px;
}

.review-modal {
  width: 100%;
  max-width: 480px;
  background: linear-gradient(145deg, #0f0f19 0%, #1a1a28 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6), 0 0 1px rgba(0, 240, 255, 0.1);
}

.review-modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
}

.review-modal-header.modal-approve {
  background: linear-gradient(90deg, rgba(0, 240, 255, 0.1) 0%, transparent 100%);
}

.review-modal-header.modal-reject {
  background: linear-gradient(90deg, rgba(255, 61, 0, 0.1) 0%, transparent 100%);
}

.review-modal-header .modal-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.review-modal-header.modal-approve .modal-icon {
  color: #00F0FF;
}

.review-modal-header.modal-reject .modal-icon {
  color: #FF3D00;
}

.modal-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
  flex: 1;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.modal-close:hover {
  background: rgba(255, 61, 0, 0.2);
  border-color: rgba(255, 61, 0, 0.3);
  color: #FF3D00;
}

.modal-close .close-icon {
  width: 18px;
  height: 18px;
}

.review-modal-content {
  padding: 24px;
}

.modal-subtitle {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 16px 0;
  line-height: 1.6;
}

.modal-subtitle .highlight {
  font-family: 'Rajdhani', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #00F0FF;
}

.modal-subtitle .text-approve {
  color: #00F0FF;
  font-weight: 600;
}

.modal-subtitle .text-reject {
  color: #FF3D00;
  font-weight: 600;
}

.review-modal-content .form-group {
  margin-bottom: 16px;
}

.review-textarea {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: white;
  resize: none;
  line-height: 1.6;
  transition: all 0.3s ease;
}

.review-textarea:focus {
  outline: none;
  border-color: rgba(0, 240, 255, 0.4);
  background: rgba(0, 240, 255, 0.03);
}

.review-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.char-count {
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  text-align: right;
  margin: 6px 0 0 0;
}

/* 快捷选项 */
.quick-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-option-btn {
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-option-btn:hover {
  background: rgba(0, 240, 255, 0.1);
  border-color: rgba(0, 240, 255, 0.3);
  color: #00F0FF;
}

.review-modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px;
}

.modal-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-btn .btn-icon {
  width: 18px;
  height: 18px;
}

.modal-btn.cancel {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
}

.modal-btn.cancel:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.modal-btn.approve {
  background: linear-gradient(135deg, #00F0FF, #00C0FF);
  color: #050508;
}

.modal-btn.approve:hover {
  box-shadow: 0 8px 30px rgba(0, 240, 255, 0.4);
  transform: translateY(-2px);
}

.modal-btn.reject {
  background: linear-gradient(135deg, #FF3D00, #E63600);
  color: white;
}

.modal-btn.reject:hover {
  box-shadow: 0 8px 30px rgba(255, 61, 0, 0.4);
  transform: translateY(-2px);
}

/* 审核弹窗动画 */
.review-enter-active,
.review-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.review-enter-active .review-modal,
.review-leave-active .review-modal {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.review-enter-from,
.review-leave-to {
  opacity: 0;
}

.review-enter-from .review-modal,
.review-leave-to .review-modal {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

/* ========== 响应式 ========== */
@media (max-width: 1400px) {
  .stats-section {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 12px 20px;
  }

  .main-content {
    grid-template-columns: 1fr 320px;
    gap: 16px;
    padding: 0 20px 20px;
  }
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .sidebar {
    order: -1;
  }

  .sidebar-card {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .dashboard-header { padding: 16px; }
  .header-title { font-size: 18px; }

  .stats-section {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 12px 16px;
  }

  .stat-card { padding: 12px; }
  .stat-icon-wrapper { width: 40px; height: 40px; }
  .stat-value { font-size: 20px; }

  .main-content { padding: 0 16px 16px; }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .list-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .review-card {
    flex-wrap: wrap;
  }

  .card-thumb {
    width: 100%;
    height: 160px;
  }

  .card-info {
    width: 100%;
  }

  .card-uploader {
    width: 100%;
  }

  .card-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .sidebar-card {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .pagination {
    flex-direction: column;
    gap: 8px;
  }

  .page-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
