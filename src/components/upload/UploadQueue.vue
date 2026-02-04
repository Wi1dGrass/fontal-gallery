<template>
  <div class="upload-queue">
    <!-- 队列头部 -->
    <div class="queue-header">
      <h3 class="queue-title">
        上传队列
        <span v-if="queue.length" class="queue-count">({{ queue.length }})</span>
      </h3>
      <div class="header-actions">
        <span class="queue-stats">
          <span v-if="queueStats.pending" class="stat pending">{{ queueStats.pending }} 待上传</span>
          <span v-if="queueStats.ready" class="stat ready">{{ queueStats.ready }} 已完成</span>
          <span v-if="queueStats.error" class="stat error">{{ queueStats.error }} 失败</span>
        </span>
        <button v-if="queue.length" class="clear-btn" @click="$emit('clear')">
          <Trash2 class="clear-icon" />
          清空
        </button>
      </div>
    </div>

    <!-- 队列列表 -->
    <div v-if="queue.length" class="queue-list">
      <UploadQueueItem
        v-for="item in queue"
        :key="item.id"
        :item="item"
        @toggle-select="$emit('toggle-select', $event)"
        @remove="$emit('remove', $event)"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="queue-empty">
      <div class="empty-icon-wrapper">
        <ImageOff class="empty-icon" />
      </div>
      <p class="empty-text">队列为空</p>
      <p class="empty-hint">拖拽图片或点击上传按钮添加图片</p>
    </div>
  </div>
</template>

<script setup>
import { ImageOff, Trash2 } from 'lucide-vue-next'
import UploadQueueItem from './UploadQueueItem.vue'

defineProps({
  queue: {
    type: Array,
    default: () => []
  },
  queueStats: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['toggle-select', 'remove', 'clear'])
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700&display=swap');

.upload-queue {
  background: rgba(13, 13, 18, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.queue-title {
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.queue-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.queue-stats {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat {
  padding: 4px 10px;
  border-radius: 20px;
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  font-weight: 500;
}

.stat.pending {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
}

.stat.ready {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.stat.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.clear-icon {
  width: 14px;
  height: 14px;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.queue-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.empty-icon-wrapper {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 50%;
  margin-bottom: 16px;
}

.empty-icon {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.2);
}

.empty-text {
  font-family: 'Exo 2', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 6px 0;
}

.empty-hint {
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
  margin: 0;
}
</style>
