<template>
  <div
    class="picture-card"
    :class="{ 'is-selected': isSelected }"
    @click="$emit('click', picture)"
  >
    <!-- 选择框 -->
    <div
      class="checkbox-wrapper"
      @click.stop="$emit('toggle', picture.id)"
    >
      <div class="checkbox" :class="{ 'checked': isSelected }">
        <Check v-if="isSelected" class="check-icon" />
      </div>
    </div>

    <!-- 图片区域 -->
    <div class="picture-wrapper">
      <img
        :src="picture.url"
        :alt="picture.name"
        class="picture-image"
        :class="{ 'loading': imageLoading }"
        @load="imageLoading = false"
        @error="imageError = true"
      />
      <!-- 加载骨架 -->
      <div v-if="imageLoading" class="skeleton-loader"></div>
      <!-- 错误状态 -->
      <div v-if="imageError" class="error-state">
        <ImageOff class="error-icon" />
      </div>

      <!-- 悬浮操作层 -->
      <div class="picture-overlay">
        <div class="overlay-actions">
          <button
            class="overlay-btn"
            @click.stop="$emit('preview', picture)"
            title="预览"
          >
            <Eye class="btn-icon" />
          </button>
          <button
            class="overlay-btn btn-delete"
            @click.stop="$emit('delete', picture)"
            title="删除"
          >
            <Trash2 class="btn-icon" />
          </button>
        </div>
      </div>

      <!-- 图片信息标签 -->
      <div class="picture-info-badge">
        <span class="info-text">{{ formatBytes(picture.picSize) }}</span>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="card-footer">
      <p class="picture-name">{{ picture.name || '未命名' }}</p>
      <p class="picture-date">{{ formatDate(picture.createTime) }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Check, Eye, Trash2, ImageOff } from 'lucide-vue-next'

const props = defineProps({
  picture: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'toggle', 'preview', 'delete'])

const imageLoading = ref(true)
const imageError = ref(false)

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700&display=swap');

.picture-card {
  position: relative;
  background: rgba(13, 13, 18, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.picture-card:hover {
  border-color: rgba(0, 240, 255, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.picture-card.is-selected {
  border-color: #00F0FF;
  box-shadow: 0 0 0 2px rgba(0, 240, 255, 0.2);
}

/* ========== 选择框 ========== */
.checkbox-wrapper {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
}

.checkbox {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.checkbox.checked {
  background: #00F0FF;
  border-color: #00F0FF;
}

.check-icon {
  width: 14px;
  height: 14px;
  color: #0a0a0a;
}

/* ========== 图片区域 ========== */
.picture-wrapper {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: rgba(10, 10, 10, 0.8);
}

.picture-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.picture-image.loading {
  opacity: 0;
}

.picture-card:hover .picture-image {
  transform: scale(1.05);
}

/* 骨架加载 */
.skeleton-loader {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 0%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.03) 100%
  );
  animation: skeletonShimmer 1.5s infinite;
}

@keyframes skeletonShimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 错误状态 */
.error-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 10, 0.8);
}

.error-icon {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.2);
}

/* 悬浮操作层 */
.picture-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 12px;
}

.picture-card:hover .picture-overlay {
  opacity: 1;
}

.overlay-actions {
  display: flex;
  gap: 8px;
}

.overlay-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.overlay-btn:hover {
  background: rgba(0, 240, 255, 0.3);
  border-color: #00F0FF;
  transform: scale(1.1);
}

.overlay-btn.btn-delete:hover {
  background: rgba(255, 61, 0, 0.3);
  border-color: #FF3D00;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* ========== 信息标签 ========== */
.picture-info-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border-radius: 6px;
}

.info-text {
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

/* ========== 底部信息 ========== */
.card-footer {
  padding: 12px;
}

.picture-name {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.picture-date {
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* ========== 响应式 ========== */
@media (max-width: 640px) {
  .picture-card {
    border-radius: 12px;
  }

  .checkbox {
    width: 20px;
    height: 20px;
  }

  .overlay-btn {
    width: 32px;
    height: 32px;
  }

  .btn-icon {
    width: 16px;
    height: 16px;
  }
}
</style>
