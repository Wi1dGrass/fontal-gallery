<template>
  <div class="storage-bar">
    <div class="storage-info">
      <span>{{ formatSize(used) }} / {{ formatSize(max) }}</span>
      <span class="count-info">{{ count }}/{{ maxCount }}张</span>
    </div>
    <div class="progress-track">
      <div
        class="progress-fill"
        :class="statusClass"
        :style="{ width: percent + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  used: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 0
  },
  count: {
    type: Number,
    default: 0
  },
  maxCount: {
    type: Number,
    default: 0
  }
})

const percent = computed(() => {
  if (props.max === 0) return 0
  return Math.min(100, (props.used / props.max) * 100)
})

const statusClass = computed(() => {
  if (percent.value >= 90) return 'danger'
  if (percent.value >= 70) return 'warning'
  return 'normal'
})

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>

<style scoped>
.storage-bar {
  width: 100%;
}

.storage-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
}

.count-info {
  color: rgba(255, 255, 255, 0.3);
}

.progress-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-fill.normal {
  background: linear-gradient(90deg, #22c55e, #4ade80);
}

.progress-fill.warning {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.progress-fill.danger {
  background: linear-gradient(90deg, #ef4444, #f87171);
}
</style>
