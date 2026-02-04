<template>
  <div class="personal-space-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <button class="back-btn" @click="$router.push('/')">
        <ArrowLeft class="back-icon" />
        返回首页
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && !space" class="loading-state">
      <Loader2 class="spinner" />
      <p>加载中...</p>
    </div>

    <!-- 空状态：未开通空间 -->
    <SpaceEmptyState
      v-else-if="!space"
      @create="handleCreateSpace"
    />

    <!-- 空间主界面 -->
    <div v-else class="space-content">
      <!-- 空间仪表盘 -->
      <SpaceDashboard
        :space="space"
        :storage-percent="storagePercent"
        :storage-status="storageStatus"
        @rename="handleRenameSpace"
      />

      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="action-left">
          <button
            class="select-all-btn"
            :class="{ 'has-selection': isSelectMode }"
            @click="toggleSelectAll"
          >
            <div class="checkbox" :class="{ 'checked': selectedIds.size === pictures.length && pictures.length > 0 }">
              <Check v-if="selectedIds.size === pictures.length && pictures.length > 0" class="check-icon" />
            </div>
            {{ isSelectMode ? `已选 ${selectedIds.size} 张` : '全选' }}
          </button>
          <button
            v-if="isSelectMode"
            class="delete-selected-btn"
            @click="handleDeleteSelected"
          >
            <Trash2 class="btn-icon" />
            删除 ({{ selectedIds.size }})
          </button>
        </div>
        <div class="action-right">
          <span class="picture-count">{{ total }} 张图片</span>
        </div>
      </div>

      <!-- 上传区域 -->
      <UploadArea
        :space-id="space.id"
        @uploaded="handleUploaded"
      />

      <!-- 图片列表 -->
      <div v-if="pictures.length > 0" class="pictures-grid">
        <SpacePictureCard
          v-for="picture in pictures"
          :key="picture.id"
          :picture="picture"
          :is-selected="selectedIds.has(picture.id)"
          @toggle="toggleSelect"
          @preview="handlePreview"
          @delete="handleDeletePicture"
        />
      </div>

      <!-- 空图片状态 -->
      <div v-else class="empty-pictures">
        <ImageOff class="empty-icon" />
        <p>还没有图片，快上传第一张吧！</p>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore && pictures.length > 0" class="load-more">
        <button
          class="load-more-btn"
          @click="loadMore"
          :disabled="loading"
        >
          <Loader2 v-if="loading" class="spinner" />
          {{ loading ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <Transition name="modal">
      <div v-if="showDeleteConfirm" class="confirm-modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="confirm-modal">
          <div class="confirm-icon-wrapper danger">
            <AlertTriangle class="confirm-icon" />
          </div>
          <h3 class="confirm-title">确认删除</h3>
          <p class="confirm-desc">
            确定要删除 {{ deleteCount }} 张图片吗？删除后无法恢复。
          </p>
          <div class="confirm-actions">
            <button class="confirm-btn btn-cancel" @click="showDeleteConfirm = false">
              取消
            </button>
            <button class="confirm-btn btn-danger" @click="confirmDelete">
              <Loader2 v-if="deleting" class="spinner" />
              {{ deleting ? '删除中...' : '确认删除' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 图片预览弹窗 -->
    <Transition name="modal">
      <div v-if="previewPicture" class="preview-modal-overlay" @click="previewPicture = null">
        <div class="preview-modal" @click.stop>
          <button class="preview-close" @click="previewPicture = null">
            <X class="close-icon" />
          </button>
          <img :src="previewPicture.url" :alt="previewPicture.name" class="preview-image" />
          <div class="preview-info">
            <p class="preview-name">{{ previewPicture.name }}</p>
            <p class="preview-meta">
              {{ formatBytes(previewPicture.picSize) }} · {{ previewPicture.picWidth }}×{{ previewPicture.picHeight }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  ArrowLeft, Loader2, Check, Trash2, ImageOff,
  AlertTriangle, X
} from 'lucide-vue-next'
import SpaceEmptyState from '@/components/personal-space/SpaceEmptyState.vue'
import SpaceDashboard from '@/components/personal-space/SpaceDashboard.vue'
import SpacePictureCard from '@/components/personal-space/SpacePictureCard.vue'
import UploadArea from '@/components/personal-space/UploadArea.vue'
import { usePersonalSpace, formatBytes } from '@/composables/usePersonalSpace.js'

const {
  space,
  pictures,
  loading,
  total,
  hasMore,
  selectedIds,
  isSelectMode,
  storagePercent,
  storageStatus,
  currentPage,
  fetchUserSpace,
  createSpace,
  updateSpaceName,
  fetchPictures,
  deletePictures,
  toggleSelect,
  toggleSelectAll
} = usePersonalSpace()

// 删除相关状态
const showDeleteConfirm = ref(false)
const deleting = ref(false)
const deleteIds = ref([])

// 预览相关状态
const previewPicture = ref(null)

// 初始化
onMounted(async () => {
  try {
    const spaceId = await fetchUserSpace()
    if (spaceId) {
      await fetchPictures(spaceId, 1, true)
    }
  } catch (error) {
    console.error('加载空间失败:', error)
  }
})

// 创建空间
async function handleCreateSpace(spaceLevel, spaceName) {
  try {
    await createSpace(spaceName, spaceLevel)
    // 创建成功后加载图片
    await fetchPictures(space.value.id, 1, true)
  } catch (error) {
    alert(error.message || '创建空间失败，请重试')
  }
}

// 重命名空间
async function handleRenameSpace(newName) {
  try {
    await updateSpaceName(space.value.id, newName)
  } catch (error) {
    alert(error.message || '重命名失败，请重试')
  }
}

// 上传完成回调
async function handleUploaded() {
  // 上传成功后刷新图片列表和空间信息
  if (space.value?.id) {
    await fetchPictures(space.value.id, 1, true)
    // 同时刷新空间信息以更新容量显示
    await fetchUserSpace()
  }
}

// 加载更多
async function loadMore() {
  if (!hasMore.value || loading.value) return
  await fetchPictures(space.value.id, currentPage.value + 1, false)
}

// 预览图片
function handlePreview(picture) {
  previewPicture.value = picture
}

// 删除单张图片
function handleDeletePicture(picture) {
  deleteIds.value = [picture.id]
  showDeleteConfirm.value = true
}

// 删除选中图片
function handleDeleteSelected() {
  if (selectedIds.value.size === 0) return
  deleteIds.value = Array.from(selectedIds.value)
  showDeleteConfirm.value = true
}

// 确认删除
async function confirmDelete() {
  deleting.value = true
  try {
    await deletePictures(space.value.id, deleteIds.value)
    showDeleteConfirm.value = false
  } catch (error) {
    alert(error.message || '删除失败，请重试')
  } finally {
    deleting.value = false
  }
}

// 删除数量
const deleteCount = computed(() => deleteIds.value.length)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600;700&display=swap');

.personal-space-page {
  min-height: 100vh;
  padding: 80px 24px 40px;
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

/* ========== 顶部导航 ========== */
.page-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 16px 24px;
  background: rgba(5, 5, 8, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(0, 240, 255, 0.1);
  border-color: rgba(0, 240, 255, 0.3);
  color: #00F0FF;
}

.back-icon {
  width: 18px;
  height: 18px;
}

/* ========== 加载状态 ========== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 400px;
}

.spinner {
  width: 48px;
  height: 48px;
  color: #00F0FF;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-state p {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

/* ========== 空间内容 ========== */
.space-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ========== 操作栏 ========== */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(13, 13, 18, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.action-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.select-all-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
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

.select-all-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.select-all-btn.has-selection {
  border-color: #00F0FF;
  color: #00F0FF;
}

.checkbox {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  transition: all 0.2s ease;
}

.checkbox.checked {
  background: #00F0FF;
  border-color: #00F0FF;
}

.check-icon {
  width: 12px;
  height: 12px;
  color: #0a0a0a;
}

.delete-selected-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 61, 0, 0.1);
  border: 1px solid rgba(255, 61, 0, 0.2);
  border-radius: 12px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #FF3D00;
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-selected-btn:hover {
  background: rgba(255, 61, 0, 0.2);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.picture-count {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

/* ========== 图片网格 ========== */
.pictures-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

/* ========== 空图片状态 ========== */
.empty-pictures {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  background: rgba(13, 13, 18, 0.6);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: rgba(255, 255, 255, 0.2);
}

.empty-pictures p {
  font-family: 'Exo 2', sans-serif;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.4);
}

/* ========== 加载更多 ========== */
.load-more {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.load-more-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 32px;
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

.load-more-btn:hover:not(:disabled) {
  background: rgba(0, 240, 255, 0.1);
  border-color: rgba(0, 240, 255, 0.3);
  color: #00F0FF;
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ========== 删除确认弹窗 ========== */
.confirm-modal-overlay,
.preview-modal-overlay {
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

.confirm-modal {
  width: 100%;
  max-width: 400px;
  padding: 32px;
  background: rgba(13, 13, 18, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  text-align: center;
}

.confirm-icon-wrapper {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  border-radius: 50%;
}

.confirm-icon-wrapper.danger {
  background: rgba(255, 61, 0, 0.15);
}

.confirm-icon {
  width: 32px;
  height: 32px;
  color: #FF3D00;
}

.confirm-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin-bottom: 12px;
}

.confirm-desc {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 24px;
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
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

.btn-danger {
  background: rgba(255, 61, 0, 0.2);
  border: 1px solid rgba(255, 61, 0, 0.3);
  color: #FF3D00;
}

.btn-danger:hover:not(:disabled) {
  background: rgba(255, 61, 0, 0.3);
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ========== 图片预览弹窗 ========== */
.preview-modal {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: rgba(13, 13, 18, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
}

.preview-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
}

.preview-close:hover {
  background: rgba(255, 61, 0, 0.3);
}

.close-icon {
  width: 20px;
  height: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
  display: block;
}

.preview-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 24px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
}

.preview-name {
  font-family: 'Exo 2', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: white;
  margin-bottom: 4px;
}

.preview-meta {
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
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

.modal-enter-from .confirm-modal,
.modal-leave-to .confirm-modal,
.modal-enter-from .preview-modal,
.modal-leave-to .preview-modal {
  transform: scale(0.9);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .personal-space-page {
    padding: 70px 16px 24px;
  }

  .pictures-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .action-bar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .action-left,
  .action-right {
    justify-content: space-between;
  }
}
</style>
