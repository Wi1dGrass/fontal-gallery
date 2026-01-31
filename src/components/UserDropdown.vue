<template>
  <div class="user-dropdown-container" ref="dropdownRef">
    <!-- 头像按钮 -->
    <button
      class="avatar-button"
      @click="toggleDropdown"
      :class="{ active: isOpen }"
    >
      <img
        v-if="currentUser?.userAvatar"
        :src="currentUser.userAvatar"
        :alt="currentUser.userName"
        class="avatar-image"
      />
      <span v-else class="avatar-fallback">
        {{ currentUser?.userName?.charAt(0)?.toUpperCase() || 'U' }}
      </span>
      <svg class="dropdown-arrow" :class="{ rotate: isOpen }" width="12" height="12" viewBox="0 0 12 12">
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- 下拉菜单 -->
    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu">
        <!-- 菜单头部：用户信息 -->
        <div class="dropdown-header">
          <div class="user-avatar-large">
            <img
              v-if="currentUser?.userAvatar"
              :src="currentUser.userAvatar"
              :alt="currentUser.userName"
              class="avatar-image-large"
            />
            <span v-else class="avatar-fallback-large">
              {{ currentUser?.userName?.charAt(0)?.toUpperCase() || 'U' }}
            </span>
            <div class="avatar-glow"></div>
          </div>
          <div class="user-info">
            <h3 class="user-name">{{ currentUser?.userName || '用户' }}</h3>
            <p class="user-email">{{ currentUser?.email || '' }}</p>
          </div>
          <div class="user-badge" :class="getRoleClass()">
            {{ getRoleLabel() }}
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="dropdown-divider"></div>

        <!-- 菜单项 -->
        <div class="dropdown-items">
          <button class="dropdown-item" @click="handleEdit">
            <User class="item-icon" />
            <span>编辑资料</span>
            <ChevronRight class="item-arrow" />
          </button>

          <button class="dropdown-item" @click="handleSettings">
            <Settings class="item-icon" />
            <span>设置</span>
            <ChevronRight class="item-arrow" />
          </button>

          <div class="dropdown-divider"></div>

          <button class="dropdown-item danger" @click="handleLogout">
            <LogOut class="item-icon" />
            <span>退出登录</span>
          </button>
        </div>

        <!-- 底部装饰 -->
        <div class="dropdown-footer">
          <div class="footer-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Settings, LogOut, ChevronRight } from 'lucide-vue-next'
import { API_BASE_URL } from '@/config/api.js'

const router = useRouter()
const dropdownRef = ref(null)
const isOpen = ref(false)
const currentUser = ref(null)

// 切换下拉菜单
function toggleDropdown() {
  isOpen.value = !isOpen.value
}

// 关闭下拉菜单
function closeDropdown() {
  isOpen.value = false
}

// 获取当前用户
async function fetchCurrentUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/user/current`, {
      credentials: 'include'
    })
    const result = await response.json()
    if (result.code === 0) {
      currentUser.value = result.data
    }
  } catch (error) {
    // 静默处理错误
  }
}

// 获取角色标签
function getRoleLabel() {
  if (currentUser.value?.userRole === 'admin') return '管理员'
  return '用户'
}

// 获取角色样式
function getRoleClass() {
  if (currentUser.value?.userRole === 'admin') return 'role-admin'
  return 'role-user'
}

// 编辑资料
function handleEdit() {
  closeDropdown()
  // 跳转到编辑页面（如果有的话）
  router.push('/settings')
}

// 设置
function handleSettings() {
  closeDropdown()
  router.push('/settings')
}

// 退出登录
async function handleLogout() {
  closeDropdown()

  try {
    // 调用退出登录接口
    await fetch(`${API_BASE_URL}/user/logout`, {
      method: 'GET',
      credentials: 'include'
    })
  } catch (error) {
    // 静默处理错误
  }

  // 设置退出登录标记
  sessionStorage.setItem('isLoggingOut', 'true')

  // 清除 sessionStorage（保留 isLoggingOut 标记）
  const isLoggingOut = sessionStorage.getItem('isLoggingOut')
  sessionStorage.clear()
  if (isLoggingOut === 'true') {
    sessionStorage.setItem('isLoggingOut', 'true')
  }

  // 注意：不清除 localStorage 中的记住密码，让用户下次登录更方便
  // 如果用户不想记住密码，可以取消"记住我"选项

  // 跳转到登录页
  router.push('/auth')
}

// 点击外部关闭菜单
function handleClickOutside(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  fetchCurrentUser()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.user-dropdown-container {
  position: relative;
  display: inline-block;
}

/* ========== 头像按钮 ========== */
.avatar-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.avatar-button:hover .avatar-image,
.avatar-button:hover .avatar-fallback {
  box-shadow:
    0 0 0 2px rgba(0, 240, 255, 0.3),
    0 0 20px rgba(0, 240, 255, 0.4);
}

.avatar-button.active .dropdown-arrow {
  transform: rotate(180deg);
}

.avatar-image {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  object-fit: cover;
  transition: all 0.3s ease;
}

.avatar-fallback {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--electric, #00F0FF), var(--electric-glow, #4DFFFF));
  color: var(--void, #0a0a0a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.3s ease;
}

.dropdown-arrow {
  color: rgba(255, 255, 255, 0.5);
  transition: transform 0.3s ease;
}

/* ========== 下拉菜单 ========== */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 280px;
  background: rgba(15, 15, 20, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
  z-index: 1000;
}

/* 菜单头部 */
.dropdown-header {
  position: relative;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.user-avatar-large {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: 12px;
}

.avatar-image-large {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  object-fit: cover;
  position: relative;
  z-index: 2;
}

.avatar-fallback-large {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--electric, #00F0FF), var(--electric-glow, #4DFFFF));
  color: var(--void, #0a0a0a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 24px;
  position: relative;
  z-index: 2;
}

.avatar-glow {
  position: absolute;
  inset: -4px;
  background: linear-gradient(135deg, var(--electric, #00F0FF), var(--lava, #FF3D00));
  border-radius: 20px;
  opacity: 0.3;
  filter: blur(12px);
  animation: avatarPulse 3s ease-in-out infinite;
  z-index: 1;
}

@keyframes avatarPulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.05); }
}

.user-info {
  margin-bottom: 8px;
}

.user-name {
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.user-email {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.user-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-badge.role-admin {
  background: linear-gradient(135deg, var(--lava, #FF3D00), var(--lava-glow, #FF6B35));
  color: white;
  box-shadow: 0 4px 15px rgba(255, 61, 0, 0.3);
}

.user-badge.role-user {
  background: rgba(0, 240, 255, 0.15);
  color: var(--electric, #00F0FF);
  border: 1px solid rgba(0, 240, 255, 0.2);
}

/* 分隔线 */
.dropdown-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  margin: 8px 16px;
}

/* 菜单项 */
.dropdown-items {
  padding: 8px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.dropdown-item.danger {
  color: var(--lava, #FF3D00);
}

.dropdown-item.danger:hover {
  background: rgba(255, 61, 0, 0.1);
}

.item-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  opacity: 0.7;
}

.dropdown-item span {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.item-arrow {
  width: 16px;
  height: 16px;
  opacity: 0.3;
}

/* 底部装饰 */
.dropdown-footer {
  padding: 12px;
  display: flex;
  justify-content: center;
}

.footer-dots {
  display: flex;
  gap: 6px;
}

.footer-dots span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.footer-dots span:nth-child(2) {
  background: var(--electric, #00F0FF);
  box-shadow: 0 0 10px var(--electric, #00F0FF);
}

/* ========== 动画 ========== */
.dropdown-enter-active {
  animation: dropdownIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-leave-active {
  animation: dropdownOut 0.2s cubic-bezier(0.4, 0, 1, 1);
}

@keyframes dropdownIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dropdownOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
}

/* ========== CSS 变量 ========== */
:deep(:root) {
  --void: #0a0a0a;
  --void-light: #141414;
  --lava: #FF3D00;
  --lava-glow: #FF6B35;
  --electric: #00F0FF;
  --electric-glow: #4DFFFF;
}
</style>
