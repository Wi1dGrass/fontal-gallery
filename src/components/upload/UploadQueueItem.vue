<template>
  <div
    class="queue-item"
    :class="{
      'selected': item.selected,
      'uploading': item.status === 'uploading',
      'error': item.status === 'error',
      'ready': item.status === 'ready',
      'expanded': isExpanded
    }"
  >
    <!-- 左侧：选择框和预览图 -->
    <div class="item-left">
      <div class="checkbox" :class="{ 'checked': item.selected }" @click="$emit('toggle-select', item.id)">
        <Check v-if="item.selected" class="check-icon" />
      </div>

      <div class="preview-wrapper" @click="toggleExpand">
        <img :src="item.preview" class="preview-image" alt="" />
        <div class="preview-overlay">
          <Expand v-if="!isExpanded" class="expand-icon" />
          <Shrink v-else class="expand-icon" />
        </div>
        <div v-if="item.status === 'uploading'" class="uploading-spinner"></div>
        <div v-else-if="item.status === 'ready'" class="status-badge success">
          <Check class="status-icon" />
        </div>
        <div v-else-if="item.status === 'error'" class="status-badge error">
          <AlertCircle class="status-icon" />
        </div>
      </div>

      <!-- 编辑按钮 -->
      <button
        v-if="item.status !== 'uploading' && item.source !== 'space'"
        class="edit-btn"
        @click="showEditor = true"
        title="编辑图片"
      >
        <Pencil class="edit-icon" />
      </button>
    </div>

    <!-- 右侧：信息 -->
    <div class="item-right">
      <div class="item-header">
        <input
          v-model="item.name"
          class="name-input"
          placeholder="图片名称"
          @click.stop
        />
        <button class="remove-btn" @click="$emit('remove', item.id)">
          <X class="remove-icon" />
        </button>
      </div>

      <!-- 展开的表单 -->
      <div v-if="isExpanded" class="item-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">分类</label>
            <select v-model="item.category" class="form-select">
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
          <label class="form-label">标签</label>
          <div class="tags-input">
            <div class="tags-list">
              <span
                v-for="(tag, index) in item.tags"
                :key="index"
                class="tag-item"
              >
                {{ tag }}
                <button @click="removeTag(index)" class="tag-remove">
                  <X class="tag-remove-icon" />
                </button>
              </span>
            </div>
            <input
              v-model="tagInput"
              class="tag-input"
              placeholder="输入标签按回车添加"
              @keydown.enter.prevent="addTag"
              @click.stop
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">介绍</label>
          <textarea
            v-model="item.introduction"
            class="form-textarea"
            placeholder="添加图片介绍..."
            rows="2"
            @click.stop
          ></textarea>
        </div>

        <!-- 错误提示 -->
        <div v-if="item.error" class="error-message">
          <AlertCircle class="error-icon" />
          {{ item.error }}
        </div>
      </div>

      <!-- 收起时的状态 -->
      <div v-else class="item-status">
        <span v-if="item.category" class="meta-tag category">{{ item.category }}</span>
        <span v-if="item.tags?.length" class="meta-tag tags">{{ item.tags.length }} 个标签</span>
        <span v-if="item.source === 'local'" class="meta-tag source">本地上传</span>
        <span v-else-if="item.source === 'url'" class="meta-tag source">URL抓取</span>
        <span v-else-if="item.source === 'space'" class="meta-tag source">个人空间</span>
      </div>
    </div>

    <!-- 图片编辑器模态框 -->
    <ImageEditor
      v-if="showEditor"
      :image-src="item.preview"
      @close="showEditor = false"
      @apply="handleEditApply"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Check, X, Expand, Shrink, AlertCircle, Pencil } from 'lucide-vue-next'
import ImageEditor from './ImageEditor.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['toggle-select', 'remove'])

const isExpanded = ref(false)
const tagInput = ref('')
const showEditor = ref(false)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !props.item.tags.includes(tag)) {
    props.item.tags.push(tag)
    tagInput.value = ''
  }
}

function removeTag(index) {
  props.item.tags.splice(index, 1)
}

// 编辑器应用回调
function handleEditApply({ file, preview }) {
  // 更新队列项
  props.item.file = file
  props.item.preview = preview
  props.item.source = 'local'
  props.item.status = 'pending'
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700&display=swap');

.queue-item {
  display: flex;
  gap: 14px;
  padding: 14px;
  background: rgba(10, 10, 10, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  transition: all 0.3s ease;
}

.queue-item:hover {
  background: rgba(10, 10, 10, 0.8);
  border-color: rgba(255, 255, 255, 0.12);
}

.queue-item.selected {
  background: rgba(147, 51, 234, 0.08);
  border-color: rgba(147, 51, 234, 0.3);
}

.queue-item.uploading {
  border-color: rgba(255, 61, 0, 0.3);
}

.queue-item.error {
  border-color: rgba(239, 68, 68, 0.3);
}

.queue-item.ready {
  border-color: rgba(34, 197, 94, 0.2);
}

.item-left {
  display: flex;
  align-items: center;
  gap: 12px;
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
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.checkbox:hover {
  border-color: rgba(147, 51, 234, 0.5);
}

.checkbox.checked {
  background: #9333EA;
  border-color: #9333EA;
}

.check-icon {
  width: 12px;
  height: 12px;
  color: white;
}

.preview-wrapper {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.preview-wrapper:hover .preview-overlay {
  opacity: 1;
}

.expand-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.uploading-spinner {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.uploading-spinner::after {
  content: '';
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 61, 0, 0.3);
  border-top-color: #FF3D00;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.status-badge.success {
  background: rgba(34, 197, 94, 0.9);
}

.status-badge.error {
  background: rgba(239, 68, 68, 0.9);
}

.status-icon {
  width: 14px;
  height: 14px;
  color: white;
}

.item-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.name-input {
  flex: 1;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  color: white;
  transition: all 0.2s ease;
}

.name-input:focus {
  outline: none;
  border-color: rgba(147, 51, 234, 0.4);
  background: rgba(147, 51, 234, 0.05);
}

.name-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.remove-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.remove-icon {
  width: 16px;
  height: 16px;
}

.item-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-select {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  color: white;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: rgba(147, 51, 234, 0.4);
}

.form-select option {
  background: #1a1a1a;
}

.tags-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px 4px 10px;
  background: rgba(147, 51, 234, 0.15);
  border: 1px solid rgba(147, 51, 234, 0.3);
  border-radius: 5px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  color: #e9d5ff;
}

.tag-remove {
  display: flex;
  padding: 0;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  border-radius: 3px;
}

.tag-remove:hover {
  color: #ef4444;
}

.tag-remove-icon {
  width: 10px;
  height: 10px;
}

.tag-input {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  color: white;
}

.tag-input:focus {
  outline: none;
  border-color: rgba(147, 51, 234, 0.4);
}

.tag-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.form-textarea {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  color: white;
  resize: vertical;
  min-height: 60px;
}

.form-textarea:focus {
  outline: none;
  border-color: rgba(147, 51, 234, 0.4);
}

.form-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  color: #fca5a5;
}

.error-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.item-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-tag {
  padding: 4px 8px;
  border-radius: 5px;
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
}

.meta-tag.category {
  background: rgba(0, 240, 255, 0.15);
  color: #00F0FF;
}

.meta-tag.tags {
  background: rgba(147, 51, 234, 0.15);
  color: #e9d5ff;
}

.meta-tag.source {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
}

/* ========== 编辑按钮 ========== */
.edit-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(147, 51, 234, 0.15);
  border: 1px solid rgba(147, 51, 234, 0.3);
  border-radius: 8px;
  color: #e9d5ff;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.edit-btn:hover {
  background: rgba(147, 51, 234, 0.3);
  border-color: rgba(147, 51, 234, 0.5);
  transform: scale(1.05);
}

.edit-icon {
  width: 14px;
  height: 14px;
}
</style>
