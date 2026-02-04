<template>
  <div class="space-dashboard">
    <div class="dashboard-header">
      <div class="dashboard-title-row">
        <div class="title-left">
          <div class="shield-icon-wrapper">
            <Shield class="shield-icon" />
          </div>
          <div class="title-text">
            <h2 class="dashboard-title">{{ space?.spaceName || '我的私人空间' }}</h2>
            <span class="level-badge" :class="levelClass">
              {{ spaceLevelInfo?.name || '普通版' }}
            </span>
          </div>
        </div>
        <button class="rename-btn" @click="showRenameModal = true">
          <Edit3 class="rename-icon" />
          重命名
        </button>
      </div>
    </div>

    <!-- 存储容量卡片 -->
    <div class="storage-card" :class="storageClass">
      <div class="storage-header">
        <div class="storage-info">
          <p class="storage-label">存储空间</p>
          <p class="storage-value">
            {{ formatBytes(space?.totalSize || 0) }} / {{ formatBytes(space?.maxSize || 0) }}
          </p>
        </div>
        <div class="storage-stats">
          <div class="stat">
            <p class="stat-value">{{ space?.totalCount || 0 }}</p>
            <p class="stat-label">图片</p>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <p class="stat-value">{{ storagePercent.toFixed(1) }}%</p>
            <p class="stat-label">已用</p>
          </div>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${storagePercent}%` }"></div>
      </div>

      <!-- 状态提示 -->
      <div class="storage-status">
        <Info class="status-icon" :class="statusIconClass" />
        <span class="status-text" :class="statusTextClass">
          {{ storageStatus.text }}
        </span>
      </div>
    </div>

    <!-- 重命名模态框 -->
    <Transition name="modal">
      <div v-if="showRenameModal" class="rename-modal-overlay" @click.self="showRenameModal = false">
        <div class="rename-modal">
          <h3 class="modal-title">重命名空间</h3>
          <input
            v-model="newSpaceName"
            type="text"
            class="rename-input"
            placeholder="输入新的空间名称"
            maxlength="20"
            @keyup.enter="handleRename"
          />
          <div class="modal-actions">
            <button class="modal-btn btn-cancel" @click="showRenameModal = false">
              取消
            </button>
            <button class="modal-btn btn-confirm" @click="handleRename" :disabled="!newSpaceName.trim()">
              确认
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Shield, Edit3, Info } from 'lucide-vue-next'
import { formatBytes, SPACE_LEVELS } from '@/composables/usePersonalSpace.js'

const props = defineProps({
  space: {
    type: Object,
    default: null
  },
  storagePercent: {
    type: Number,
    default: 0
  },
  storageStatus: {
    type: Object,
    default: () => ({ type: 'normal', text: '充足' })
  }
})

const emit = defineEmits(['rename'])

const showRenameModal = ref(false)
const newSpaceName = ref('')

// 空间等级信息
const spaceLevelInfo = computed(() => {
  if (!props.space) return SPACE_LEVELS.COMMON
  return props.space.spaceLevel === 1 ? SPACE_LEVELS.PROFESSIONAL : SPACE_LEVELS.COMMON
})

// 等级样式类
const levelClass = computed(() => {
  return props.space?.spaceLevel === 1 ? 'level-pro' : 'level-common'
})

// 存储状态样式类
const storageClass = computed(() => {
  return `storage-${props.storageStatus.type}`
})

const statusIconClass = computed(() => {
  return `status-${props.storageStatus.type}`
})

const statusTextClass = computed(() => {
  return `text-${props.storageStatus.type}`
})

// 监听模态框显示，初始化名称
watch(showRenameModal, (show) => {
  if (show) {
    newSpaceName.value = props.space?.spaceName || ''
  }
})

async function handleRename() {
  if (!newSpaceName.value.trim()) return
  emit('rename', newSpaceName.value.trim())
  showRenameModal.value = false
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600;700&display=swap');

.space-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ========== 顶部标题 ========== */
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dashboard-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.shield-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(0, 240, 255, 0.05));
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 12px;
}

.shield-icon {
  width: 24px;
  height: 24px;
  color: #00F0FF;
}

.title-text {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dashboard-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.level-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.level-common {
  background: rgba(0, 240, 255, 0.15);
  color: #00F0FF;
  border: 1px solid rgba(0, 240, 255, 0.2);
}

.level-pro {
  background: linear-gradient(135deg, #FFA726, #FF6B00);
  color: white;
  border: none;
}

.rename-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
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

.rename-btn:hover {
  background: rgba(0, 240, 255, 0.1);
  border-color: rgba(0, 240, 255, 0.3);
  color: #00F0FF;
}

.rename-icon {
  width: 16px;
  height: 16px;
}

/* ========== 存储容量卡片 ========== */
.storage-card {
  padding: 24px;
  background: rgba(13, 13, 18, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.storage-card.storage-normal {
  border-color: rgba(0, 240, 255, 0.2);
}

.storage-card.storage-warning {
  border-color: rgba(255, 167, 38, 0.3);
  background: linear-gradient(135deg, rgba(255, 167, 38, 0.1), rgba(13, 13, 18, 0.8));
}

.storage-card.storage-danger {
  border-color: rgba(255, 61, 0, 0.3);
  background: linear-gradient(135deg, rgba(255, 61, 0, 0.1), rgba(13, 13, 18, 0.8));
}

.storage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.storage-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.storage-label {
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.storage-value {
  font-family: 'Orbitron', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.storage-stats {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-family: 'Orbitron', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.stat-label {
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
}

/* ========== 进度条 ========== */
.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00F0FF, #00C0CC);
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.storage-card.storage-warning .progress-fill {
  background: linear-gradient(90deg, #FFA726, #FF6B00);
}

.storage-card.storage-danger .progress-fill {
  background: linear-gradient(90deg, #FF3D00, #CC3100);
}

/* ========== 状态提示 ========== */
.storage-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  width: 16px;
  height: 16px;
}

.status-icon.status-normal {
  color: #00F0FF;
}

.status-icon.status-warning {
  color: #FFA726;
}

.status-icon.status-danger {
  color: #FF3D00;
}

.status-text {
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
}

.status-text.text-normal {
  color: rgba(0, 240, 255, 0.8);
}

.status-text.text-warning {
  color: rgba(255, 167, 38, 0.8);
}

.status-text.text-danger {
  color: rgba(255, 61, 0, 0.8);
}

/* ========== 重命名模态框 ========== */
.rename-modal-overlay {
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

.rename-modal {
  width: 100%;
  max-width: 400px;
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

.rename-input {
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

.rename-input:focus {
  outline: none;
  border-color: #00F0FF;
  box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.1);
}

.rename-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
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

/* Modal 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .rename-modal,
.modal-leave-to .rename-modal {
  transform: scale(0.9);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .dashboard-title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .storage-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .dashboard-title {
    font-size: 20px;
  }

  .storage-value {
    font-size: 20px;
  }
}
</style>
