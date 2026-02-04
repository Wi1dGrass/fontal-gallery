<template>
  <div class="space-empty-state">
    <!-- 顶部返回 -->
    <div class="empty-header">
      <button class="back-btn" @click="$router.push('/')">
        <ArrowLeft class="back-icon" />
        返回首页
      </button>
    </div>

    <!-- 空状态内容 -->
    <div class="empty-content">
      <!-- 锁定图标 -->
      <div class="lock-icon-wrapper">
        <div class="lock-glow"></div>
        <Lock class="lock-icon" />
      </div>

      <h1 class="empty-title">开通您的个人空间</h1>
      <p class="empty-desc">安全存储私人图片，支持分类管理与快速访问</p>

      <!-- 空间等级选择 -->
      <div class="level-cards">
        <div
          v-for="level in levels"
          :key="level.value"
          class="level-card"
          :class="{
            'level-selected': selectedLevel === level.value,
            'level-professional': level.value === 1
          }"
          @click="selectedLevel = level.value"
        >
          <div class="level-badge" :class="level.value === 1 ? 'badge-pro' : 'badge-common'">
            {{ level.name }}
          </div>

          <div class="level-stats">
            <div class="stat-item">
              <Shield class="stat-icon" />
              <span class="stat-value">{{ level.maxCount }} 张</span>
            </div>
            <div class="stat-item">
              <HardDrive class="stat-icon" />
              <span class="stat-value">{{ formatBytes(level.maxSize) }}</span>
            </div>
          </div>

          <p class="level-desc">{{ level.desc }}</p>

          <button
            class="select-btn"
            :class="{ 'btn-selected': selectedLevel === level.value }"
          >
            <Check v-if="selectedLevel === level.value" class="check-icon" />
            <Circle v-else class="circle-icon" />
            {{ selectedLevel === level.value ? '已选择' : '选择此方案' }}
          </button>
        </div>
      </div>

      <!-- 创建按钮 -->
      <button class="create-btn" @click="handleCreate" :disabled="creating">
        <Loader2 v-if="creating" class="spinner" />
        <Sparkles v-else class="sparkle-icon" />
        {{ creating ? '创建中...' : '立即开通' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  ArrowLeft, Lock, Shield, HardDrive, Check, Circle,
  Loader2, Sparkles
} from 'lucide-vue-next'

const emit = defineEmits(['create'])

const selectedLevel = ref(0)  // 默认选择普通版
const creating = ref(false)

const levels = [
  {
    value: 0,
    name: '普通版',
    maxCount: 100,
    maxSize: 100 * 1024 * 1024,
    desc: '适合日常使用，存储常用图片'
  },
  {
    value: 1,
    name: '专业版',
    maxCount: 1000,
    maxSize: 1000 * 1024 * 1024,
    desc: '海量存储空间，专业用户首选'
  }
]

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

async function handleCreate() {
  creating.value = true
  try {
    await emit('create', selectedLevel.value, '我的私人空间')
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600;700&display=swap');

.space-empty-state {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
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

/* ========== 顶部返回 ========== */
.empty-header {
  position: absolute;
  top: 24px;
  left: 24px;
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

/* ========== 空状态内容 ========== */
.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 800px;
  width: 100%;
}

/* ========== 锁定图标 ========== */
.lock-icon-wrapper {
  position: relative;
  margin-bottom: 32px;
}

.lock-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(0, 240, 255, 0.3), transparent 70%);
  filter: blur(30px);
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

.lock-icon {
  position: relative;
  width: 64px;
  height: 64px;
  color: #00F0FF;
}

/* ========== 标题 ========== */
.empty-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: white;
  text-align: center;
  margin-bottom: 12px;
}

.empty-desc {
  font-family: 'Exo 2', sans-serif;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  margin-bottom: 48px;
}

/* ========== 等级卡片 ========== */
.level-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  width: 100%;
  margin-bottom: 32px;
}

.level-card {
  position: relative;
  padding: 24px;
  background: rgba(13, 13, 18, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.level-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.05), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.level-card:hover {
  border-color: rgba(0, 240, 255, 0.3);
  transform: translateY(-4px);
}

.level-card:hover::before {
  opacity: 1;
}

.level-card.level-selected {
  border-color: #00F0FF;
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.2);
}

.level-card.level-professional.level-selected {
  border-color: #FFA726;
  box-shadow: 0 0 30px rgba(255, 167, 38, 0.2);
}

/* 等级徽章 */
.level-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
}

.badge-common {
  background: rgba(0, 240, 255, 0.15);
  color: #00F0FF;
}

.badge-pro {
  background: linear-gradient(135deg, #FFA726, #FF6B00);
  color: white;
}

/* 等级统计 */
.level-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.4);
}

.stat-value {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.level-desc {
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 20px;
}

/* 选择按钮 */
.select-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
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

.select-btn:hover {
  background: rgba(0, 240, 255, 0.1);
  border-color: rgba(0, 240, 255, 0.3);
  color: #00F0FF;
}

.select-btn.btn-selected {
  background: rgba(0, 240, 255, 0.2);
  border-color: #00F0FF;
  color: #00F0FF;
}

.level-card.level-professional .select-btn.btn-selected {
  background: rgba(255, 167, 38, 0.2);
  border-color: #FFA726;
  color: #FFA726;
}

.check-icon,
.circle-icon {
  width: 18px;
  height: 18px;
}

/* ========== 创建按钮 ========== */
.create-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 48px;
  background: linear-gradient(135deg, #00F0FF, #00C0CC);
  border: none;
  border-radius: 16px;
  font-family: 'Orbitron', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #0a0a0a;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 30px rgba(0, 240, 255, 0.3);
}

.create-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 240, 255, 0.4);
}

.create-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.sparkle-icon {
  width: 20px;
  height: 20px;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .level-cards {
    grid-template-columns: 1fr;
  }

  .empty-title {
    font-size: 24px;
  }

  .empty-desc {
    font-size: 14px;
  }
}
</style>
