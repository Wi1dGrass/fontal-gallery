<template>
  <div class="image-editor-modal" @click.self="$emit('close')">
    <div class="editor-container">
      <!-- 头部 -->
      <div class="editor-header">
        <h3 class="editor-title">图片编辑</h3>
        <div class="header-actions">
          <button class="header-btn" @click="handleReset" :disabled="!hasChanges">
            <RotateCcw class="btn-icon" />
            重置
          </button>
          <button class="header-btn close" @click="$emit('close')">
            <X class="btn-icon" />
          </button>
        </div>
      </div>

      <!-- 画布区域 -->
      <div class="canvas-area">
        <canvas
          ref="canvasRef"
          class="editor-canvas"
        ></canvas>
        <div v-if="!isReady" class="loading-spinner">
          <Loader2 class="spinner" />
        </div>
      </div>

      <!-- 工具栏 -->
      <div class="editor-toolbar">
        <!-- 主工具 -->
        <div class="tool-section">
          <button
            class="tool-btn"
            :class="{ active: cropMode }"
            @click="cycleCropMode"
            title="裁剪"
          >
            <Crop class="tool-icon" />
            <span class="tool-label">裁剪</span>
          </button>
          <button class="tool-btn" @click="rotate90" title="旋转">
            <RotateCw class="tool-icon" />
            <span class="tool-label">旋转</span>
          </button>
          <button
            class="tool-btn"
            :class="{ active: flipH }"
            @click="toggleFlipH"
            title="水平翻转"
          >
            <FlipHorizontal class="tool-icon" />
            <span class="tool-label">水平</span>
          </button>
          <button
            class="tool-btn"
            :class="{ active: flipV }"
            @click="toggleFlipV"
            title="垂直翻转"
          >
            <FlipVertical class="tool-icon" />
            <span class="tool-label">垂直</span>
          </button>
        </div>

        <!-- 分隔线 -->
        <div class="toolbar-divider"></div>

        <!-- 滤镜选择 -->
        <div class="tool-section">
          <button
            v-for="(filter, key) in filters"
            :key="key"
            class="filter-btn"
            :class="{ active: selectedFilter === key }"
            @click="setFilter(key)"
          >
            {{ filter.name }}
          </button>
        </div>
      </div>

      <!-- 调整面板 -->
      <Transition name="slide-up">
        <div v-if="selectedFilter === 'none' || selectedFilter === null" class="adjust-panel">
          <div class="adjust-item">
            <div class="adjust-header">
              <Sun class="adjust-icon" />
              <span class="adjust-label">亮度</span>
              <span class="adjust-value">{{ brightness }}%</span>
            </div>
            <input
              type="range"
              :value="brightness"
              @input="setBrightness($event.target.value)"
              min="0"
              max="200"
              class="adjust-slider"
            />
          </div>
          <div class="adjust-item">
            <div class="adjust-header">
              <Contrast class="adjust-icon" />
              <span class="adjust-label">对比度</span>
              <span class="adjust-value">{{ contrast }}%</span>
            </div>
            <input
              type="range"
              :value="contrast"
              @input="setContrast($event.target.value)"
              min="0"
              max="200"
              class="adjust-slider"
            />
          </div>
          <div class="adjust-item">
            <div class="adjust-header">
              <Droplet class="adjust-icon" />
              <span class="adjust-label">饱和度</span>
              <span class="adjust-value">{{ saturation }}%</span>
            </div>
            <input
              type="range"
              :value="saturation"
              @input="setSaturation($event.target.value)"
              min="0"
              max="200"
              class="adjust-slider"
            />
          </div>
        </div>
      </Transition>

      <!-- 底部操作 -->
      <div class="editor-footer">
        <button class="footer-btn btn-cancel" @click="$emit('close')">
          取消
        </button>
        <button
          class="footer-btn btn-primary"
          @click="handleApply"
          :disabled="isApplying"
        >
          <Loader2 v-if="isApplying" class="btn-icon spin" />
          <Check v-else class="btn-icon" />
          {{ isApplying ? '应用中...' : '应用' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import {
  X, RotateCcw, RotateCw, Crop, FlipHorizontal, FlipVertical,
  Sun, Contrast, Droplet, Check, Loader2
} from 'lucide-vue-next'
import { useImageEditor } from '@/composables/useImageEditor.js'

const props = defineProps({
  imageSrc: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'apply'])

const canvasRef = ref(null)
const isApplying = ref(false)

// 使用编辑器
const {
  canvas,
  ctx,
  isReady,
  rotation,
  flipH,
  flipV,
  cropMode,
  brightness,
  contrast,
  saturation,
  selectedFilter,
  filters,
  hasChanges,
  initCanvas,
  loadImage,
  render,
  rotate90,
  toggleFlipH,
  toggleFlipV,
  setCropMode,
  setFilter,
  setBrightness,
  setContrast,
  setSaturation,
  resetEdits,
  exportAsBlob
} = useImageEditor(props.imageSrc)

// 裁剪模式循环
function cycleCropMode() {
  const modes = [null, '1:1', '4:3', '16:9', 'free']
  const currentIndex = modes.indexOf(cropMode.value)
  const nextIndex = (currentIndex + 1) % modes.length
  setCropMode(modes[nextIndex])
}

// 重置
function handleReset() {
  resetEdits()
}

// 应用编辑
async function handleApply() {
  isApplying.value = true

  try {
    const blob = await exportAsBlob()
    if (blob) {
      // 创建新的 File 对象
      const file = new File([blob], 'edited_image.png', { type: 'image/png' })
      emit('apply', {
        file,
        preview: URL.createObjectURL(blob)
      })
    }
    emit('close')
  } catch (error) {
    console.error('导出图片失败:', error)
    alert('应用编辑失败')
  } finally {
    isApplying.value = false
  }
}

// 初始化
onMounted(async () => {
  if (canvasRef.value) {
    initCanvas(canvasRef.value)
  }

  try {
    await loadImage(props.imageSrc)
  } catch (error) {
    console.error('加载图片失败:', error)
    alert('加载图片失败')
    emit('close')
  }
})

// 清理
onUnmounted(() => {
  // 清理资源
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600;700&display=swap');

.image-editor-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  z-index: 2000;
  padding: 20px;
}

.editor-container {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  background: rgba(10, 10, 10, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
}

/* ========== 头部 ========== */
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.editor-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
}

.header-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.header-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.header-btn.close:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.btn-icon.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========== 画布区域 ========== */
.canvas-area {
  position: relative;
  flex: 1;
  min-height: 300px;
  max-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-conic-gradient(
    rgba(255, 255, 255, 0.03) 0deg 90deg,
    transparent 90deg 180deg
  );
  background-size: 20px 20px;
  overflow: hidden;
}

.editor-canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.loading-spinner {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 40px;
  height: 40px;
  color: #FF3D00;
  animation: spin 1s linear infinite;
}

/* ========== 工具栏 ========== */
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  overflow-x: auto;
}

.tool-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.tool-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.tool-btn.active {
  background: rgba(255, 61, 0, 0.15);
  border-color: rgba(255, 61, 0, 0.4);
  color: #FF3D00;
}

.tool-icon {
  width: 20px;
  height: 20px;
}

.tool-label {
  font-size: 10px;
}

.toolbar-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
}

.filter-btn {
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.filter-btn.active {
  background: linear-gradient(135deg, #9333EA, #7C3AED);
  border-color: transparent;
  color: white;
}

/* ========== 调整面板 ========== */
.adjust-panel {
  display: flex;
  gap: 24px;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.adjust-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.adjust-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.adjust-icon {
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.5);
}

.adjust-label {
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

.adjust-value {
  margin-left: auto;
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #FF3D00;
}

.adjust-slider {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.adjust-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #FF3D00;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.adjust-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.adjust-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #FF3D00;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.adjust-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

/* ========== 底部操作 ========== */
.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 10px;
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
  color: white;
}

.btn-primary {
  background: linear-gradient(135deg, #FF3D00, #FF6B35);
  border: none;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 4px 20px rgba(255, 61, 0, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== 动画 ========== */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ========== 响应式 ========== */
@media (max-width: 640px) {
  .editor-toolbar {
    flex-wrap: wrap;
  }

  .adjust-panel {
    flex-direction: column;
    gap: 16px;
  }

  .tool-btn {
    padding: 8px 10px;
  }

  .tool-label {
    display: none;
  }
}
</style>
