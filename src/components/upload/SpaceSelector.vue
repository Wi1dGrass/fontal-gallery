<template>
  <div class="space-selector">
    <div class="selector-header">
      <h3 class="selector-title">目标空间</h3>
      <button v-if="!personalSpace" class="create-btn" @click="$emit('create-space')">
        <Plus class="create-icon" />
        创建新空间
      </button>
    </div>

    <div class="space-options">
      <!-- 公共空间 -->
      <div
        class="space-option"
        :class="{ 'selected': !modelValue }"
        @click="selectSpace(null)"
      >
        <div class="space-option-content">
          <div class="space-icon public">
            <Globe class="icon" />
          </div>
          <div class="space-info">
            <div class="space-name">公共空间</div>
            <div class="space-meta">上传至公共图库，所有人可见</div>
          </div>
        </div>
        <div class="space-status">
          <span class="status-badge unlimited">无限制</span>
        </div>
      </div>

      <!-- 个人空间 -->
      <div
        v-if="personalSpace"
        class="space-option"
        :class="{ 'selected': modelValue?.id === personalSpace.id }"
        @click="selectSpace(personalSpace)"
      >
        <div class="space-option-content">
          <div class="space-icon personal">
            <Lock class="icon" />
          </div>
          <div class="space-info">
            <div class="space-name">{{ personalSpace.spaceName }}</div>
            <div class="space-meta">
              <StorageBar
                :used="personalSpace.totalSize"
                :max="personalSpace.maxSize"
                :count="personalSpace.totalCount"
                :max-count="personalSpace.maxCount"
              />
            </div>
          </div>
        </div>
        <div class="space-status">
          <Check v-if="modelValue?.id === personalSpace.id" class="check-icon" />
        </div>
      </div>

      <!-- 无个人空间 -->
      <div
        v-else
        class="space-option disabled"
      >
        <div class="space-option-content">
          <div class="space-icon personal">
            <Lock class="icon" />
          </div>
          <div class="space-info">
            <div class="space-name">个人空间</div>
            <div class="space-meta">暂未开通</div>
          </div>
        </div>
        <button class="create-mini-btn" @click="$emit('create-space')">
          <Plus class="create-mini-icon" />
          创建
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Globe, Lock, Plus, Check } from 'lucide-vue-next'
import StorageBar from './StorageBar.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  },
  personalSpace: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'create-space'])

function selectSpace(space) {
  emit('update:modelValue', space)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700&display=swap');

.space-selector {
  background: rgba(13, 13, 18, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.selector-title {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 10px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #00F0FF;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-btn:hover {
  background: rgba(0, 240, 255, 0.2);
  border-color: rgba(0, 240, 255, 0.4);
}

.create-icon {
  width: 14px;
  height: 14px;
}

.space-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.space-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.space-option:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
}

.space-option.selected {
  background: rgba(0, 240, 255, 0.08);
  border-color: rgba(0, 240, 255, 0.3);
}

.space-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.space-option-content {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}

.space-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.space-icon.public {
  background: rgba(0, 240, 255, 0.15);
}

.space-icon.public .icon {
  color: #00F0FF;
}

.space-icon.personal {
  background: rgba(147, 51, 234, 0.15);
}

.space-icon.personal .icon {
  color: #9333EA;
}

.icon {
  width: 20px;
  height: 20px;
}

.space-info {
  flex: 1;
}

.space-name {
  font-family: 'Exo 2', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: white;
  margin-bottom: 4px;
}

.space-meta {
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.space-status {
  display: flex;
  align-items: center;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  font-weight: 500;
}

.status-badge.unlimited {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.check-icon {
  width: 20px;
  height: 20px;
  color: #00F0FF;
}

.create-mini-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(147, 51, 234, 0.2);
  border: 1px solid rgba(147, 51, 234, 0.3);
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #e9d5ff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-mini-btn:hover {
  background: rgba(147, 51, 234, 0.3);
}

.create-mini-icon {
  width: 12px;
  height: 12px;
}
</style>
