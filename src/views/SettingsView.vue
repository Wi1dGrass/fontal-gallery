<template>
  <div class="settings-page">
    <!-- 初始加载状态 -->
    <div v-if="isInitialLoading" class="loading-overlay">
      <Loader2 class="spinner" />
      <p>加载中...</p>
    </div>

    <!-- 左侧导航 -->
    <aside class="settings-sidebar">
      <div class="sidebar-header">
        <h2 class="sidebar-title">设置</h2>
        <p class="sidebar-subtitle">管理您的账户信息</p>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="sidebar-tab"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" class="tab-icon" />
          <span class="tab-label">{{ tab.label }}</span>
          <ChevronRight v-if="activeTab === tab.key" class="tab-arrow" />
        </button>
      </nav>
    </aside>

    <!-- 右侧内容 -->
    <main class="settings-main">
      <!-- 个人信息 -->
    <div v-if="activeTab === 'profile'" class="content-section">
        <!-- 用户信息卡片 -->
        <div class="profile-card">
          <div class="profile-header">
            <div class="avatar-section">
              <div class="avatar-large">
                <img
                  v-if="form.userAvatar"
                  :src="form.userAvatar"
                  :alt="form.userName"
                  class="avatar-image"
                />
                <span v-else class="avatar-fallback">
                  {{ form.userName?.charAt(0)?.toUpperCase() || 'U' }}
                </span>
                <!-- 头像发光效果 -->
                <div class="avatar-glow"></div>
              </div>

              <!-- 上传按钮 -->
              <button class="avatar-upload-btn" @click="triggerFileInput">
                <Camera class="camera-icon" />
              </button>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                @change="handleFileChange"
                style="display: none"
              />
            </div>

            <div class="profile-info">
              <div class="profile-name-row">
                <h2 class="profile-name">{{ form.userName || '用户' }}</h2>
                <span class="profile-badge" :class="getRoleClass()">
                  {{ getRoleLabel() }}
                </span>
              </div>
              <p class="profile-email">{{ form.email || '' }}</p>
              <p class="profile-provider">
                <component :is="getProviderIcon()" class="provider-icon" />
                通过 {{ getProviderLabel() }} 登录
              </p>
            </div>
          </div>
        </div>

        <!-- 基本信息编辑 -->
        <div class="settings-card">
          <div class="card-header">
            <h3 class="card-title">基本信息</h3>
            <p class="card-subtitle">更新您的个人信息</p>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <div class="input-wrapper">
                <User class="input-icon" />
                <input
                  v-model="form.userName"
                  type="text"
                  class="form-input"
                  :maxlength="LIMITS.MAX_USERNAME_LENGTH"
                  placeholder="输入用户名"
                />
                <span class="input-counter">{{ form.userName?.length || 0 }}/{{ LIMITS.MAX_USERNAME_LENGTH }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">邮箱</label>
              <div class="input-wrapper">
                <Mail class="input-icon" />
                <input
                  v-model="form.email"
                  type="email"
                  class="form-input"
                  placeholder="your@email.com"
                />
                <LockKeyhole class="input-lock" />
              </div>
              <p class="form-hint">邮箱不可修改</p>
            </div>

            <div class="form-group full-width">
              <label class="form-label">个人简介</label>
              <div class="textarea-wrapper">
                <textarea
                  v-model="form.userProfile"
                  class="form-textarea"
                  :maxlength="LIMITS.MAX_PROFILE_LENGTH"
                  rows="3"
                  placeholder="介绍一下你自己..."
                ></textarea>
                <span class="input-counter">{{ form.userProfile?.length || 0 }}/{{ LIMITS.MAX_PROFILE_LENGTH }}</span>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn btn-secondary" @click="resetForm">
              重置
            </button>
            <button class="btn btn-primary" @click="handleSave" :disabled="isSaving">
              <Loader2 v-if="isSaving" class="spinner" />
              <Check v-else class="check-icon" />
              {{ isSaving ? '保存中...' : '保存更改' }}
            </button>
          </div>
        </div>

        <!-- 账号信息 -->
        <div class="settings-card">
          <div class="card-header">
            <h3 class="card-title">账号信息</h3>
            <p class="card-subtitle">您的账户详细资料</p>
          </div>

          <div class="info-list">
            <div class="info-item">
              <div class="info-icon-wrapper">
                <Hash class="info-icon" />
              </div>
              <div class="info-content">
                <span class="info-label">用户 ID</span>
                <span class="info-value">{{ form.id || '-' }}</span>
              </div>
            </div>

            <div class="info-item">
              <div class="info-icon-wrapper">
                <Calendar class="info-icon" />
              </div>
              <div class="info-content">
                <span class="info-label">注册时间</span>
                <span class="info-value">{{ formatDate(currentUser?.createTime) }}</span>
              </div>
            </div>

            <div class="info-item">
              <div class="info-icon-wrapper">
                <Clock class="info-icon" />
              </div>
              <div class="info-content">
                <span class="info-label">最后登录</span>
                <span class="info-value">{{ formatDate(currentUser?.lastLoginTime) }}</span>
              </div>
            </div>

            <div class="info-item">
              <div class="info-icon-wrapper">
                <Shield class="info-icon" />
              </div>
              <div class="info-content">
                <span class="info-label">认证方式</span>
                <span class="info-value">
                  <component :is="getProviderIcon()" class="provider-small" />
                  {{ getProviderLabel() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 安全设置 -->
      <div v-else-if="activeTab === 'security'" class="content-section">
        <div class="settings-card">
          <div class="card-header">
            <h3 class="card-title">密码</h3>
            <p class="card-subtitle">修改您的登录密码</p>
          </div>

          <div class="form-grid">
            <div class="form-group full-width">
              <label class="form-label">当前密码</label>
              <div class="input-wrapper">
                <Lock class="input-icon" />
                <input
                  v-model="passwordForm.currentPassword"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  class="form-input"
                  placeholder="输入当前密码"
                />
                <button class="input-toggle" @click="showCurrentPassword = !showCurrentPassword">
                  <Eye v-if="!showCurrentPassword" class="eye-icon" />
                  <EyeOff v-else class="eye-icon" />
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">新密码</label>
              <div class="input-wrapper">
                <KeyRound class="input-icon" />
                <input
                  v-model="passwordForm.newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  class="form-input"
                  placeholder="输入新密码"
                  minlength="8"
                />
                <button class="input-toggle" @click="showNewPassword = !showNewPassword">
                  <Eye v-if="!showNewPassword" class="eye-icon" />
                  <EyeOff v-else class="eye-icon" />
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">确认密码</label>
              <div class="input-wrapper">
                <KeyRound class="input-icon" />
                <input
                  v-model="passwordForm.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  class="form-input"
                  placeholder="再次输入新密码"
                />
                <button class="input-toggle" @click="showConfirmPassword = !showConfirmPassword">
                  <Eye v-if="!showConfirmPassword" class="eye-icon" />
                  <EyeOff v-else class="eye-icon" />
                </button>
              </div>
            </div>
          </div>

          <div v-if="passwordError" class="error-message">
            <AlertCircle class="error-icon" />
            {{ passwordError }}
          </div>

          <div class="card-actions">
            <button class="btn btn-primary" @click="handlePasswordChange" :disabled="isChangingPassword">
              <Loader2 v-if="isChangingPassword" class="spinner" />
              <Shield v-else class="btn-icon" />
              {{ isChangingPassword ? '修改中...' : '修改密码' }}
            </button>
          </div>
        </div>

        <div class="settings-card warning-card">
          <div class="warning-header">
            <div class="warning-icon-wrapper">
              <AlertTriangle class="warning-icon" />
            </div>
            <div>
              <h4 class="warning-title">危险区域</h4>
              <p class="warning-subtitle">注销账户后将无法恢复</p>
            </div>
          </div>
          <button class="btn btn-danger">
            <Trash2 class="btn-icon" />
            注销账户
          </button>
        </div>
      </div>

      <!-- 通知设置 -->
      <div v-else-if="activeTab === 'notifications'" class="content-section">
        <div class="settings-card">
          <div class="card-header">
            <h3 class="card-title">通知设置</h3>
            <p class="card-subtitle">管理您的通知偏好</p>
          </div>

          <div class="notification-list">
            <div class="notification-item">
              <div class="notification-info">
                <div class="notification-icon-wrapper email">
                  <Mail class="notification-icon" />
                </div>
                <div>
                  <h4 class="notification-title">邮件通知</h4>
                  <p class="notification-desc">接收关于您账户的重要更新</p>
                </div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="notifications.email" />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="notification-item">
              <div class="notification-info">
                <div class="notification-icon-wrapper system">
                  <Bell class="notification-icon" />
                </div>
                <div>
                  <h4 class="notification-title">系统通知</h4>
                  <p class="notification-desc">接收系统更新和活动通知</p>
                </div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="notifications.system" />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="notification-item">
              <div class="notification-info">
                <div class="notification-icon-wrapper security">
                  <Shield class="notification-icon" />
                </div>
                <div>
                  <h4 class="notification-title">安全提醒</h4>
                  <p class="notification-desc">登录和密码变更提醒</p>
                </div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="notifications.security" checked disabled />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 保存成功提示 -->
    <Transition name="toast">
      <div v-if="showToast" class="toast" :class="toastType">
        <CheckCircle v-if="toastType === 'success'" class="toast-icon" />
        <XCircle v-else class="toast-icon" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  User, Mail, Lock, Camera, Hash, Calendar, Clock, Shield,
  ChevronRight, Loader2, Check, Eye, EyeOff, KeyRound, LockKeyhole,
  AlertCircle, AlertTriangle, Trash2, Bell, CheckCircle, XCircle,
  Github
} from 'lucide-vue-next'
import { API_BASE_URL } from '@/config/api.js'
import { LIMITS, TOAST_DURATION } from '@/config/constants.js'

const router = useRouter()

// 初始加载状态
const isInitialLoading = ref(true)

// 当前标签
const activeTab = ref('profile')

// 侧边栏标签
const tabs = [
  { key: 'profile', label: '个人信息', icon: User },
  { key: 'security', label: '安全设置', icon: Shield },
  { key: 'notifications', label: '通知设置', icon: Bell }
]

// 用户信息表单
const form = reactive({
  id: null,
  userName: '',
  email: '',
  userAvatar: '',
  userProfile: '',
  userRole: '',
  provider: ''
})

// 原始数据（用于重置）
const originalForm = reactive({})

// 当前用户完整信息
const currentUser = ref(null)

// 密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码显示状态
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 通知设置
const notifications = reactive({
  email: true,
  system: false,
  security: true
})

// 加载状态
const isSaving = ref(false)
const isChangingPassword = ref(false)

// 文件上传
const fileInputRef = ref(null)

// Toast 提示
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const passwordError = ref('')

// 获取当前用户
async function fetchCurrentUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/user/current`, {
      credentials: 'include'
    })
    const result = await response.json()

    if (result.code === 0) {
      // 更新 sessionStorage 中的 userId（保持最新）
      if (result.data.id) {
        sessionStorage.setItem('userId', result.data.id)
      }

      currentUser.value = result.data
      // 填充表单字段
      Object.assign(form, result.data)
      Object.assign(originalForm, result.data)
    } else {
      // 未登录或登录已过期，跳转到登录页
      router.push('/auth')
    }
  } catch (error) {
    // 网络错误也跳转到登录页
    router.push('/auth')
  } finally {
    isInitialLoading.value = false
  }
}

// 获取角色标签
function getRoleLabel() {
  if (form.userRole === 'admin') return '管理员'
  return '用户'
}

// 获取角色样式
function getRoleClass() {
  if (form.userRole === 'admin') return 'role-admin'
  return 'role-user'
}

// 获取认证方式图标
function getProviderIcon() {
  if (form.provider === 'github') return Github
  return Mail
}

// 获取认证方式标签
function getProviderLabel() {
  if (form.provider === 'github') return 'GitHub'
  if (form.provider === 'google') return 'Google'
  return '邮箱'
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 触发文件选择
function triggerFileInput() {
  fileInputRef.value?.click()
}

// 处理文件选择
async function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    showToastMsg('请选择图片文件', 'error')
    return
  }

  // 检查文件大小
  if (file.size > LIMITS.MAX_AVATAR_SIZE) {
    const maxSizeMB = Math.round(LIMITS.MAX_AVATAR_SIZE / (1024 * 1024))
    showToastMsg(`图片大小不能超过 ${maxSizeMB}MB`, 'error')
    return
  }

  // 上传图片
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/picture/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    })

    const result = await response.json()
    if (result.code === 0 && result.data?.url) {
      form.userAvatar = result.data.url
      showToastMsg('头像上传成功')
    } else {
      showToastMsg('头像上传失败', 'error')
    }
  } catch (error) {
    showToastMsg('头像上传失败', 'error')
  }

  // 清空文件输入
  event.target.value = ''
}

// 保存用户信息
async function handleSave() {
  // 检查 id 是否存在
  if (!form.id) {
    showToastMsg('用户信息异常，请刷新页面重试', 'error')
    return
  }

  isSaving.value = true

  const requestData = {
    id: form.id,
    userName: form.userName,
    userAvatar: form.userAvatar,
    userProfile: form.userProfile
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/update`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    })

    const result = await response.json()
    if (result.code === 0) {
      Object.assign(originalForm, form)
      showToastMsg('保存成功')
    } else {
      showToastMsg(result.message || '保存失败', 'error')
    }
  } catch (error) {
    showToastMsg('网络错误，保存失败', 'error')
  } finally {
    isSaving.value = false
  }
}

// 重置表单
function resetForm() {
  Object.assign(form, originalForm)
  showToastMsg('已重置')
}

// 修改密码
async function handlePasswordChange() {
  passwordError.value = ''

  // 验证
  if (!passwordForm.currentPassword) {
    passwordError.value = '请输入当前密码'
    return
  }
  if (!passwordForm.newPassword || passwordForm.newPassword.length < LIMITS.MIN_PASSWORD_LENGTH) {
    passwordError.value = `新密码至少需要 ${LIMITS.MIN_PASSWORD_LENGTH} 个字符`
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = '两次输入的密码不一致'
    return
  }

  isChangingPassword.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/user/update/password`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        checkPassword: passwordForm.confirmPassword
      })
    })

    const result = await response.json()
    if (result.code === 0) {
      // 密码修改成功，后端会清除 session，需要重新登录
      // 设置退出登录标记，避免 AuthView 调用 /api/user/current
      sessionStorage.setItem('isLoggingOut', 'true')

      // 清空本地存储的记住密码（旧密码已失效）
      localStorage.removeItem('rememberedEmail')
      localStorage.removeItem('rememberedPassword')

      // 提示用户并跳转到登录页
      showToastMsg('密码修改成功，请重新登录')
      setTimeout(() => {
        // 使用 router.push 替代 window.location.href
        window.location.href = '/auth'
      }, 1500)
    } else {
      showToastMsg(result.message || '密码修改失败', 'error')
    }
  } catch (error) {
    showToastMsg('网络错误，密码修改失败', 'error')
  } finally {
    isChangingPassword.value = false
  }
}

// 显示提示
function showToastMsg(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true

  setTimeout(() => {
    showToast.value = false
  }, TOAST_DURATION)
}

onMounted(() => {
  fetchCurrentUser()
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--void, #0a0a0a);
  z-index: 100;
}

.loading-overlay .spinner {
  width: 40px;
  height: 40px;
  color: var(--electric, #00F0FF);
  animation: spin 1s linear infinite;
}

.loading-overlay p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.settings-page {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 32px;
  min-height: calc(100vh - 64px);
  padding: 32px;
}

/* ========== 侧边栏 ========== */
.settings-sidebar {
  position: sticky;
  top: 96px;
  height: fit-content;
}

.sidebar-header {
  margin-bottom: 24px;
}

.sidebar-title {
  font-family: 'Syne', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
}

.sidebar-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-tab {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.sidebar-tab:hover {
  background: rgba(255, 255, 255, 0.05);
}

.sidebar-tab.active {
  background: linear-gradient(135deg, rgba(255, 61, 0, 0.15), rgba(255, 61, 0, 0.05));
  border: 1px solid rgba(255, 61, 0, 0.3);
}

.tab-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.5);
}

.sidebar-tab.active .tab-icon {
  color: var(--lava, #FF3D00);
}

.tab-label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.sidebar-tab.active .tab-label {
  color: white;
}

.tab-arrow {
  width: 18px;
  height: 18px;
  color: var(--lava, #FF3D00);
}

/* ========== 主内容区 ========== */
.settings-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ========== 卡片 ========== */
.settings-card {
  background: rgba(20, 20, 20, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 24px;
}

.card-header {
  margin-bottom: 24px;
}

.card-title {
  font-family: 'Syne', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.card-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

/* ========== 用户信息卡片 ========== */
.profile-card {
  background: linear-gradient(135deg, rgba(255, 61, 0, 0.1), rgba(0, 240, 255, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
}

.profile-header {
  display: flex;
  gap: 24px;
  align-items: center;
}

.avatar-section {
  position: relative;
}

.avatar-large {
  position: relative;
  width: 100px;
  height: 100px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 24px;
  object-fit: cover;
  position: relative;
  z-index: 2;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 24px;
  background: linear-gradient(135deg, var(--electric, #00F0FF), var(--electric-glow, #4DFFFF));
  color: var(--void, #0a0a0a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  position: relative;
  z-index: 2;
}

.avatar-glow {
  position: absolute;
  inset: -6px;
  background: linear-gradient(135deg, var(--electric, #00F0FF), var(--lava, #FF3D00));
  border-radius: 30px;
  opacity: 0.4;
  filter: blur(20px);
  animation: avatarGlow 4s ease-in-out infinite;
  z-index: 1;
}

@keyframes avatarGlow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }
}

.avatar-upload-btn {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 32px;
  height: 32px;
  background: var(--lava, #FF3D00);
  border: 3px solid var(--void, #0a0a0a);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 3;
}

.avatar-upload-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(255, 61, 0, 0.5);
}

.camera-icon {
  width: 14px;
  height: 14px;
  color: white;
}

.profile-info {
  flex: 1;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.profile-name {
  font-family: 'Syne', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.profile-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.profile-badge.role-admin {
  background: linear-gradient(135deg, var(--lava, #FF3D00), var(--lava-glow, #FF6B35));
  color: white;
  box-shadow: 0 4px 15px rgba(255, 61, 0, 0.3);
}

.profile-badge.role-user {
  background: rgba(0, 240, 255, 0.15);
  color: var(--electric, #00F0FF);
  border: 1px solid rgba(0, 240, 255, 0.2);
}

.profile-email {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
}

.profile-provider {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.provider-icon {
  width: 14px;
  height: 14px;
}

/* ========== 表单 ========== */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.3);
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 12px 14px 12px 44px;
  background: rgba(10, 10, 10, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--electric, #00F0FF);
  box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.1);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.input-lock {
  position: absolute;
  right: 14px;
  width: 14px;
  height: 14px;
  color: rgba(255, 255, 255, 0.2);
}

.input-counter {
  position: absolute;
  right: 14px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
}

.input-toggle {
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.eye-icon {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.3);
  transition: color 0.3s ease;
}

.input-toggle:hover .eye-icon {
  color: rgba(255, 255, 255, 0.6);
}

.textarea-wrapper {
  position: relative;
}

.form-textarea {
  width: 100%;
  padding: 12px 14px;
  background: rgba(10, 10, 10, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  transition: all 0.3s ease;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--electric, #00F0FF);
  box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.1);
}

.form-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 4px;
}

/* ========== 卡片操作 ========== */
.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--electric, #00F0FF), var(--electric-glow, #4DFFFF));
  color: var(--void, #0a0a0a);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 8px 25px rgba(0, 240, 255, 0.4);
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-danger {
  background: rgba(255, 61, 0, 0.1);
  color: var(--lava, #FF3D00);
  border: 1px solid rgba(255, 61, 0, 0.2);
}

.btn-danger:hover {
  background: rgba(255, 61, 0, 0.2);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ========== 账号信息列表 ========== */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(10, 10, 10, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.info-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-icon {
  width: 18px;
  height: 18px;
  color: var(--electric, #00F0FF);
}

.info-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.info-value {
  font-size: 14px;
  color: white;
  display: flex;
  align-items: center;
  gap: 6px;
}

.provider-small {
  width: 14px;
  height: 14px;
}

/* ========== 通知设置 ========== */
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notification-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(10, 10, 10, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.notification-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-icon-wrapper.email {
  background: rgba(0, 240, 255, 0.1);
}

.notification-icon-wrapper.system {
  background: rgba(255, 61, 0, 0.1);
}

.notification-icon-wrapper.security {
  background: rgba(255, 107, 53, 0.1);
}

.notification-icon {
  width: 18px;
  height: 18px;
}

.notification-icon-wrapper.email .notification-icon {
  color: var(--electric, #00F0FF);
}

.notification-icon-wrapper.system .notification-icon {
  color: var(--lava, #FF3D00);
}

.notification-icon-wrapper.security .notification-icon {
  color: var(--lava-glow, #FF6B35);
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: white;
  margin-bottom: 2px;
}

.notification-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* Toggle 开关 */
.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.toggle-switch input {
  display: none;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--electric, #00F0FF);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-switch input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-switch input:disabled + .toggle-slider::before {
  background: rgba(255, 255, 255, 0.5);
}

/* ========== 警告卡片 ========== */
.warning-card {
  border-color: rgba(255, 61, 0, 0.2);
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.warning-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 61, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-icon {
  width: 24px;
  height: 24px;
  color: var(--lava, #FF3D00);
}

.warning-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.warning-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

/* ========== 错误消息 ========== */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 61, 0, 0.1);
  border: 1px solid rgba(255, 61, 0, 0.2);
  border-radius: 10px;
  color: var(--lava, #FF3D00);
  font-size: 14px;
  margin-bottom: 16px;
}

.error-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* ========== Toast 提示 ========== */
.toast {
  position: fixed;
  bottom: 32px;
  right: 32px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(15, 15, 20, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.toast.success {
  border-color: rgba(0, 240, 255, 0.3);
}

.toast.success .toast-icon {
  color: var(--electric, #00F0FF);
}

.toast.error {
  border-color: rgba(255, 61, 0, 0.3);
}

.toast.error .toast-icon {
  color: var(--lava, #FF3D00);
}

.toast-icon {
  width: 20px;
  height: 20px;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .settings-page {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .settings-sidebar {
    position: static;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .profile-name-row {
    justify-content: center;
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
