<template>
  <div class="public-gallery">
    <!-- 头部 -->
    <div class="gallery-header">
      <div class="header-content">
        <h1 class="gallery-title">公共图库</h1>
        <p class="gallery-subtitle">探索来自全球创作者的精彩作品</p>
      </div>
      <button class="upload-btn" @click="showUploadModal = true">
        <Upload class="btn-icon" />
        上传作品
      </button>
    </div>

    <!-- 图片瀑布流 -->
    <ImageGallery @image-click="handleImageClick" />

    <!-- 上传弹窗 -->
    <ImageUploadModal
      v-if="showUploadModal"
      :show="showUploadModal"
      @close="showUploadModal = false"
      @uploaded="handleUploaded"
    />

    <!-- 图片详情弹窗 -->
    <ImageDetailModal
      v-if="showDetail"
      :images="detailImages"
      :initial-index="detailIndex"
      @close="showDetail = false"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Upload } from 'lucide-vue-next'
import ImageGallery from '@/components/ImageGallery.vue'
import ImageUploadModal from '@/components/ImageUploadModal.vue'
import ImageDetailModal from '@/components/ImageDetailModal.vue'

// Refs
const showUploadModal = ref(false)
const showDetail = ref(false)
const detailIndex = ref(0)
const detailImages = ref([])

// Methods
const handleImageClick = (image) => {
  // 图片点击事件由 ImageGallery 内部处理详情弹窗
}

const handleUploaded = () => {
  // 上传成功后刷新列表
  window.location.reload()
}
</script>

<style scoped>
.public-gallery {
  min-height: 100vh;
  padding: 32px 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 20px;
}

.header-content {
  animation: fadeIn 0.5s ease;
}

.gallery-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
}

.gallery-subtitle {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--lava, #FF3D00), var(--lava-glow, #FF6B35));
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(255, 61, 0, 0.3);
}

.upload-btn:hover {
  box-shadow: 0 8px 30px rgba(255, 61, 0, 0.5);
  transform: translateY(-2px);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* CSS 变量 */
:deep(:root) {
  --void: #0a0a0a;
  --lava: #FF3D00;
  --lava-glow: #FF6B35;
  --electric: #00F0FF;
}

/* 响应式 */
@media (max-width: 640px) {
  .gallery-header {
    flex-direction: column;
    align-items: stretch;
  }

  .upload-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
