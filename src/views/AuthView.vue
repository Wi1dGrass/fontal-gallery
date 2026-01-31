<template>
  <div class="min-h-screen bg-noise overflow-hidden flex items-center justify-center p-5">
    <!-- 星空背景 -->
    <div class="stars-container">
      <div class="nebula-bg"></div>
      <div class="stars-small"></div>
      <div class="stars-medium"></div>
      <div class="stars-large"></div>
      <div class="bright-stars">
        <div v-for="i in 12" :key="'star-' + i" class="bright-star"></div>
      </div>
      <div v-for="i in 3" :key="'meteor-' + i" class="meteor"></div>
    </div>

    <!-- 主容器 -->
    <div class="auth-container">
      <!-- Logo 区域 -->
      <div class="logo-section">
        <div class="logo-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <h1>欢迎来到 FON Gallery</h1>
        <p class="subtitle">{{ activeTab === 'login' ? '登录以继续您的创作之旅' : '创建账户开始创作' }}</p>
      </div>

      <!-- 主卡片 -->
      <div class="auth-card">
        <!-- Tab 切换 -->
        <div class="tabs">
          <button
            class="tab"
            :class="{ active: activeTab === 'login' }"
            @click="activeTab = 'login'"
          >登录</button>
          <button
            class="tab"
            :class="{ active: activeTab === 'register' }"
            @click="activeTab = 'register'"
          >注册</button>
        </div>

        <!-- 登录表单 -->
        <form class="form" :class="{ active: activeTab === 'login' }" @submit.prevent="handleLogin">
          <div class="form-group">
            <label>邮箱地址</label>
            <div class="input-wrapper">
              <input
                v-model="loginForm.email"
                type="email"
                placeholder="your@email.com"
                required
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
          </div>

          <div class="form-group">
            <label>密码</label>
            <div class="input-wrapper">
              <input
                v-model="loginForm.userPassword"
                :type="showLoginPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <button type="button" class="password-toggle" @click="showLoginPassword = !showLoginPassword">
                <svg v-if="!showLoginPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="loginForm.remember" />
              记住我
            </label>
            <a href="#" class="forgot-link" @click.prevent>忘记密码？</a>
          </div>

          <p v-if="loginError" class="error-message">{{ loginError }}</p>
          <button type="submit" class="btn" :disabled="isLoading">
            {{ isLoading ? '登录中...' : '登录' }}
          </button>
        </form>

        <!-- 注册表单 -->
        <form class="form" :class="{ active: activeTab === 'register' }" @submit.prevent="handleRegister">
          <div class="form-group">
            <label>用户名</label>
            <div class="input-wrapper">
              <input
                v-model="registerForm.userName"
                type="text"
                placeholder="您的用户名"
                required
                minlength="2"
                :maxlength="LIMITS.MAX_USERNAME_LENGTH"
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          </div>

          <div class="form-group">
            <label>邮箱地址</label>
            <div class="input-wrapper">
              <input
                v-model="registerForm.email"
                type="email"
                placeholder="your@email.com"
                required
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
          </div>

          <div class="form-group">
            <label>密码</label>
            <div class="input-wrapper">
              <input
                v-model="registerForm.userPassword"
                :type="showRegisterPassword ? 'text' : 'password'"
                :placeholder="`至少${LIMITS.MIN_PASSWORD_LENGTH}位字符`"
                required
                :minlength="LIMITS.MIN_PASSWORD_LENGTH"
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <button type="button" class="password-toggle" @click="showRegisterPassword = !showRegisterPassword">
                <svg v-if="!showRegisterPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>确认密码</label>
            <div class="input-wrapper">
              <input
                v-model="registerForm.checkPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="再次输入密码"
                required
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <button type="button" class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
                <svg v-if="!showConfirmPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="agree-text">
            <input type="checkbox" id="agree" v-model="registerForm.agree" required />
            <label for="agree">我已阅读并同意 <a href="#" @click.prevent>服务条款</a> 和 <a href="#" @click.prevent>隐私政策</a></label>
          </div>

          <p v-if="registerError" class="error-message">{{ registerError }}</p>
          <button type="submit" class="btn" :disabled="isLoading">
            {{ isLoading ? '注册中...' : '创建账户' }}
          </button>
        </form>

        <!-- 分隔线 -->
        <div class="divider">
          <span>或</span>
        </div>

        <!-- 第三方登录 -->
        <div class="social-login">
          <p>使用第三方账户继续</p>
          <div class="social-buttons">
            <button type="button" class="social-btn" @click="handleGitHubLogin">
              <svg viewBox="0 0 24 24" fill="white">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </button>
            <button type="button" class="social-btn disabled" disabled title="暂未开放">
              <svg viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google</span>
            </button>
            <button type="button" class="social-btn disabled" disabled title="暂未开放">
              <svg viewBox="0 0 24 24" fill="#07C160">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
              </svg>
              <span>微信</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 返回首页 -->
      <div class="back-link-wrapper">
        <router-link to="/" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL, getGitHubAuthUrl } from '@/config/api.js'
import { LIMITS } from '@/config/constants.js'

const router = useRouter()

// Tab 状态
const activeTab = ref('login')

// 加载状态
const isLoading = ref(false)

// 错误信息
const loginError = ref('')
const registerError = ref('')

// 密码显示状态
const showLoginPassword = ref(false)
const showRegisterPassword = ref(false)
const showConfirmPassword = ref(false)

// 登录表单
const loginForm = ref({
  email: '',
  userPassword: '',
  remember: false
})

// 注册表单
const registerForm = ref({
  userName: '',
  email: '',
  userPassword: '',
  checkPassword: '',
  agree: false
})

// 表单验证
const isPasswordMatch = computed(() => {
  return registerForm.value.userPassword === registerForm.value.checkPassword
})

const isPasswordLongEnough = computed(() => {
  return registerForm.value.userPassword.length >= LIMITS.MIN_PASSWORD_LENGTH
})

/**
 * 处理邮箱登录
 */
async function handleLogin() {
  isLoading.value = true
  loginError.value = ''

  try {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginForm.value.email,
        userPassword: loginForm.value.userPassword
      })
    })

    const result = await response.json()

    if (result.code === 0) {
      // 登录成功，保存用户 ID 到 sessionStorage
      if (result.data?.id) {
        sessionStorage.setItem('userId', result.data.id)
      }

      // 处理"记住我"功能
      if (loginForm.value.remember) {
        localStorage.setItem('rememberedEmail', loginForm.value.email)
        localStorage.setItem('rememberedPassword', loginForm.value.userPassword)
      } else {
        localStorage.removeItem('rememberedEmail')
        localStorage.removeItem('rememberedPassword')
      }

      // 等待 session 建立，然后跳转
      await new Promise(resolve => setTimeout(resolve, 300))
      router.push('/')
    } else {
      loginError.value = result.message || '登录失败，请检查邮箱和密码'
    }
  } catch (error) {
    loginError.value = '网络错误，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

/**
 * 处理邮箱注册
 */
async function handleRegister() {
  // 验证密码是否一致
  if (registerForm.value.userPassword !== registerForm.value.checkPassword) {
    registerError.value = '两次输入的密码不一致'
    return
  }

  isLoading.value = true
  registerError.value = ''

  try {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: registerForm.value.userName,
        email: registerForm.value.email,
        userPassword: registerForm.value.userPassword,
        checkPassword: registerForm.value.checkPassword
      })
    })

    const result = await response.json()

    if (result.code === 0) {
      // 注册成功，切换到登录 Tab 并自动填写邮箱和密码
      activeTab.value = 'login'
      loginForm.value.email = registerForm.value.email
      loginForm.value.userPassword = registerForm.value.userPassword
      registerError.value = ''
      // 清空注册表单
      registerForm.value.userName = ''
      registerForm.value.email = ''
      registerForm.value.userPassword = ''
      registerForm.value.checkPassword = ''
      registerForm.value.agree = false
    } else {
      registerError.value = result.message || '注册失败，请重试'
    }
  } catch (error) {
    registerError.value = '网络错误，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

/**
 * 处理 GitHub OAuth 登录
 */
function handleGitHubLogin() {
  window.location.href = getGitHubAuthUrl()
}

/**
 * 处理 OAuth 回调
 */
async function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')

  if (code) {
    isLoading.value = true

    try {
      const response = await fetch(`${API_BASE_URL}/user/oauth/github`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })

      const result = await response.json()

      if (result.code === 0) {
        // OAuth 登录成功，保存用户 ID
        if (result.data?.id) {
          sessionStorage.setItem('userId', result.data.id)
        }
        // 等待 session 建立，然后跳转
        await new Promise(resolve => setTimeout(resolve, 300))
        router.replace('/')
      } else {
        loginError.value = result.message || 'GitHub 登录失败，请重试'
        activeTab.value = 'login'
      }
    } catch (error) {
      loginError.value = 'GitHub 登录失败，请稍后重试'
      activeTab.value = 'login'
    } finally {
      isLoading.value = false
    }
  }
}

// 组件挂载时检查 OAuth 回调和记住我
onMounted(async () => {
  // 检查是否是退出登录后的跳转（通过 sessionStorage 标记）
  const isLoggingOut = sessionStorage.getItem('isLoggingOut')
  if (isLoggingOut === 'true') {
    // 清除标记，显示登录页
    sessionStorage.removeItem('isLoggingOut')
    // 不调用 /api/user/current，直接加载记住的账号密码
    handleOAuthCallback()

    const rememberedEmail = localStorage.getItem('rememberedEmail')
    const rememberedPassword = localStorage.getItem('rememberedPassword')

    if (rememberedEmail && rememberedPassword) {
      loginForm.value.email = rememberedEmail
      loginForm.value.userPassword = rememberedPassword
      loginForm.value.remember = true
    }
    return
  }

  // 先检查是否已登录，如果已登录则跳转首页
  try {
    const response = await fetch(`${API_BASE_URL}/user/current`, {
      credentials: 'include'
    })
    const result = await response.json()
    if (result.code === 0) {
      // 已登录，跳转到首页
      router.replace('/')
      return
    }
  } catch (error) {
    // 忽略错误，继续显示登录页
  }

  // 检查 OAuth 回调
  handleOAuthCallback()

  // 加载记住的账号密码
  const rememberedEmail = localStorage.getItem('rememberedEmail')
  const rememberedPassword = localStorage.getItem('rememberedPassword')

  if (rememberedEmail && rememberedPassword) {
    loginForm.value.email = rememberedEmail
    loginForm.value.userPassword = rememberedPassword
    loginForm.value.remember = true
  }
})
</script>

<style scoped>
/* ========== 星空背景 ========== */
.stars-container {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* 小星星层 */
.stars-small {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1.5px 1.5px at 10% 15%, white, transparent),
    radial-gradient(1.5px 1.5px at 25% 30%, rgba(255,255,255,0.9), transparent),
    radial-gradient(1px 1px at 35% 55%, white, transparent),
    radial-gradient(1.5px 1.5px at 45% 25%, rgba(255,255,255,0.8), transparent),
    radial-gradient(1px 1px at 55% 65%, white, transparent),
    radial-gradient(1.5px 1.5px at 65% 15%, rgba(255,255,255,0.9), transparent),
    radial-gradient(1px 1px at 75% 45%, white, transparent),
    radial-gradient(1.5px 1.5px at 85% 75%, rgba(255,255,255,0.8), transparent),
    radial-gradient(1px 1px at 95% 35%, white, transparent),
    radial-gradient(1.5px 1.5px at 15% 85%, rgba(255,255,255,0.9), transparent),
    radial-gradient(1px 1px at 30% 70%, white, transparent),
    radial-gradient(1.5px 1.5px at 50% 90%, rgba(255,255,255,0.8), transparent),
    radial-gradient(1px 1px at 70% 10%, white, transparent),
    radial-gradient(1.5px 1.5px at 90% 50%, rgba(255,255,255,0.9), transparent),
    radial-gradient(1px 1px at 20% 45%, white, transparent),
    radial-gradient(1.5px 1.5px at 40% 80%, rgba(255,255,255,0.8), transparent),
    radial-gradient(1px 1px at 60% 20%, white, transparent),
    radial-gradient(1.5px 1.5px at 80% 95%, rgba(255,255,255,0.9), transparent),
    radial-gradient(1px 1px at 5% 60%, white, transparent),
    radial-gradient(1.5px 1.5px at 98% 5%, rgba(255,255,255,0.8), transparent),
    radial-gradient(1px 1px at 12% 92%, white, transparent),
    radial-gradient(1.5px 1.5px at 28% 78%, rgba(255,255,255,0.9), transparent),
    radial-gradient(1px 1px at 42% 12%, white, transparent),
    radial-gradient(1.5px 1.5px at 58% 38%, rgba(255,255,255,0.8), transparent),
    radial-gradient(1px 1px at 72% 62%, white, transparent),
    radial-gradient(1.5px 1.5px at 88% 88%, rgba(255,255,255,0.9), transparent),
    radial-gradient(1px 1px at 8% 28%, white, transparent),
    radial-gradient(1.5px 1.5px at 22% 52%, rgba(255,255,255,0.8), transparent),
    radial-gradient(1px 1px at 38% 72%, white, transparent),
    radial-gradient(1.5px 1.5px at 52% 8%, rgba(255,255,255,0.9), transparent);
  background-size: 550px 550px;
  animation: starsFloat 120s linear infinite;
}

/* 中等星星层 */
.stars-medium {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(2px 2px at 15% 20%, white, transparent),
    radial-gradient(2.5px 2.5px at 30% 50%, rgba(255,255,255,0.95), transparent),
    radial-gradient(2px 2px at 45% 80%, white, transparent),
    radial-gradient(2.5px 2.5px at 60% 30%, rgba(255,255,255,0.9), transparent),
    radial-gradient(2px 2px at 75% 70%, white, transparent),
    radial-gradient(2.5px 2.5px at 90% 40%, rgba(255,255,255,0.95), transparent),
    radial-gradient(2px 2px at 20% 85%, white, transparent),
    radial-gradient(2.5px 2.5px at 40% 15%, rgba(255,255,255,0.9), transparent),
    radial-gradient(2px 2px at 55% 55%, white, transparent),
    radial-gradient(2.5px 2.5px at 70% 90%, rgba(255,255,255,0.95), transparent),
    radial-gradient(2px 2px at 85% 25%, white, transparent),
    radial-gradient(2.5px 2.5px at 10% 65%, rgba(255,255,255,0.9), transparent),
    radial-gradient(2px 2px at 35% 95%, white, transparent),
    radial-gradient(2.5px 2.5px at 50% 35%, rgba(255,255,255,0.95), transparent),
    radial-gradient(2px 2px at 65% 75%, white, transparent),
    radial-gradient(2.5px 2.5px at 80% 10%, rgba(255,255,255,0.9), transparent),
    radial-gradient(2px 2px at 95% 60%, white, transparent),
    radial-gradient(2.5px 2.5px at 25% 45%, rgba(255,255,255,0.95), transparent);
  background-size: 700px 700px;
  animation: starsFloat 150s linear infinite reverse;
}

/* 大星星层（带发光） */
.stars-large {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(3px 3px at 20% 25%, white, transparent),
    radial-gradient(3px 3px at 40% 60%, rgba(255,255,255,0.98), transparent),
    radial-gradient(3.5px 3.5px at 60% 35%, white, transparent),
    radial-gradient(3px 3px at 80% 75%, rgba(255,255,255,0.95), transparent),
    radial-gradient(3.5px 3.5px at 15% 70%, white, transparent),
    radial-gradient(3px 3px at 35% 20%, rgba(255,255,255,0.98), transparent),
    radial-gradient(3.5px 3.5px at 55% 85%, white, transparent),
    radial-gradient(3px 3px at 75% 45%, rgba(255,255,255,0.95), transparent),
    radial-gradient(3.5px 3.5px at 90% 15%, white, transparent),
    radial-gradient(3px 3px at 10% 50%, rgba(255,255,255,0.98), transparent),
    radial-gradient(3.5px 3.5px at 30% 90%, white, transparent),
    radial-gradient(3px 3px at 50% 10%, rgba(255,255,255,0.95), transparent),
    radial-gradient(3.5px 3.5px at 70% 55%, white, transparent),
    radial-gradient(3px 3px at 85% 80%, rgba(255,255,255,0.98), transparent);
  background-size: 900px 900px;
  animation: starsFloat 180s linear infinite;
}

/* 十字星（亮星） */
.bright-stars {
  position: absolute;
  inset: 0;
}

.bright-star {
  position: absolute;
  width: 4px;
  height: 4px;
  background: white;
  border-radius: 50%;
  box-shadow:
    0 0 10px 2px rgba(255, 255, 255, 0.8),
    0 0 20px 4px rgba(255, 255, 255, 0.4),
    0 0 30px 6px rgba(255, 255, 255, 0.2);
  animation: twinkle var(--duration, 3s) ease-in-out infinite;
}

.bright-star::before,
.bright-star::after {
  content: '';
  position: absolute;
  background: white;
  filter: blur(0.5px);
}

.bright-star::before {
  width: 100%;
  height: 400%;
  left: 0;
  top: -150%;
}

.bright-star::after {
  width: 400%;
  height: 100%;
  left: -150%;
  top: 0;
}

/* 亮星位置 */
.bright-star:nth-child(1) { left: 8%; top: 15%; --duration: 3s; }
.bright-star:nth-child(2) { left: 25%; top: 35%; --duration: 4s; animation-delay: 0.5s; }
.bright-star:nth-child(3) { left: 45%; top: 20%; --duration: 3.5s; animation-delay: 1s; }
.bright-star:nth-child(4) { left: 65%; top: 55%; --duration: 4.5s; animation-delay: 1.5s; }
.bright-star:nth-child(5) { left: 85%; top: 25%; --duration: 3s; animation-delay: 2s; }
.bright-star:nth-child(6) { left: 15%; top: 70%; --duration: 4s; animation-delay: 0.3s; }
.bright-star:nth-child(7) { left: 38%; top: 85%; --duration: 3.5s; animation-delay: 0.8s; }
.bright-star:nth-child(8) { left: 72%; top: 78%; --duration: 4.5s; animation-delay: 1.3s; }
.bright-star:nth-child(9) { left: 92%; top: 60%; --duration: 3s; animation-delay: 1.8s; }
.bright-star:nth-child(10) { left: 55%; top: 5%; --duration: 4s; animation-delay: 0.7s; }
.bright-star:nth-child(11) { left: 5%; top: 45%; --duration: 3.5s; animation-delay: 1.2s; }
.bright-star:nth-child(12) { left: 78%; top: 8%; --duration: 4s; animation-delay: 1.7s; }

/* 流星 */
.meteor {
  position: absolute;
  width: 2px;
  height: 2px;
  background: linear-gradient(90deg, white, transparent);
  border-radius: 50%;
  opacity: 0;
  animation: meteor 8s linear infinite;
}

.meteor::before {
  content: '';
  position: absolute;
  width: 150px;
  height: 1px;
  background: linear-gradient(90deg, rgba(255,255,255,0.8), transparent);
  transform: translateX(-150px);
}

.meteor:nth-child(1) { left: 20%; animation-delay: 2s; }
.meteor:nth-child(2) { left: 50%; animation-delay: 5s; }
.meteor:nth-child(3) { left: 80%; animation-delay: 7s; }

@keyframes starsFloat {
  from { transform: translateY(0); }
  to { transform: translateY(-550px); }
}

@keyframes twinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

@keyframes meteor {
  0% { opacity: 0; transform: translateY(0) translateX(0); }
  5% { opacity: 1; }
  15% { opacity: 0; transform: translateY(300px) translateX(300px); }
  100% { opacity: 0; }
}

/* 星云背景 */
.nebula-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 50% at 20% 30%, rgba(255, 61, 0, 0.25) 0%, transparent 50%),
    radial-gradient(ellipse 60% 70% at 80% 40%, rgba(0, 240, 255, 0.2) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 60% 80%, rgba(255, 107, 53, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 40% 60% at 30% 70%, rgba(0, 240, 255, 0.12) 0%, transparent 50%);
  animation: nebulaPulse 10s ease-in-out infinite;
}

@keyframes nebulaPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* ========== 主容器 ========== */
.auth-container {
  position: relative;
  width: 100%;
  max-width: 420px;
  z-index: 10;
  animation: containerFade 1s ease-out;
}

@keyframes containerFade {
  from { opacity: 0; transform: translateY(30px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ========== Logo 区域 ========== */
.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--lava, #FF3D00), var(--lava-glow, #FF6B35));
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow:
    0 0 60px rgba(255, 61, 0, 0.5),
    0 10px 40px rgba(255, 61, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  animation: logoGlow 3s ease-in-out infinite;
}

@keyframes logoGlow {
  0%, 100% { box-shadow: 0 0 60px rgba(255, 61, 0, 0.5), 0 10px 40px rgba(255, 61, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
  50% { box-shadow: 0 0 80px rgba(255, 61, 0, 0.7), 0 10px 40px rgba(255, 61, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
}

.logo-section h1 {
  font-family: 'Syne', sans-serif;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 0 40px rgba(255, 61, 0, 0.4);
}

.logo-section .subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

/* ========== 卡片 ========== */
.auth-card {
  background: rgba(10, 10, 10, 0.7);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 32px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.8),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

/* 卡片发光边框 */
.auth-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  padding: 1px;
  background: linear-gradient(
    135deg,
    rgba(255, 61, 0, 0.4) 0%,
    transparent 30%,
    transparent 70%,
    rgba(0, 240, 255, 0.3) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

/* Tab 切换 */
.tabs {
  display: flex;
  padding: 4px;
  background: rgba(20, 20, 20, 0.8);
  border-radius: 12px;
  margin-bottom: 32px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.tab {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Manrope', sans-serif;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab:hover {
  color: white;
}

.tab.active {
  background: linear-gradient(135deg, var(--lava, #FF3D00), var(--lava-glow, #FF6B35));
  color: white;
  box-shadow:
    0 4px 20px rgba(255, 61, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* 表单 */
.form {
  display: none;
}

.form.active {
  display: block;
  animation: formFadeIn 0.4s ease;
}

@keyframes formFadeIn {
  from { opacity: 0; transform: translateX(15px); }
  to { opacity: 1; transform: translateX(0); }
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.input-wrapper {
  position: relative;
}

.input-wrapper svg {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.3);
  width: 20px;
  height: 20px;
  transition: all 0.3s ease;
  z-index: 2;
}

.input-wrapper input {
  width: 100%;
  padding: 12px 16px 12px 48px;
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  color: white;
  font-family: 'Manrope', sans-serif;
  font-size: 14px;
  transition: all 0.3s ease;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--lava, #FF3D00);
  box-shadow:
    0 0 0 3px rgba(255, 61, 0, 0.15),
    0 0 20px rgba(255, 61, 0, 0.2);
  background: rgba(20, 20, 20, 1);
}

.input-wrapper input:focus + svg {
  color: var(--lava, #FF3D00);
  filter: drop-shadow(0 0 8px rgba(255, 61, 0, 0.5));
}

.input-wrapper input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.password-toggle {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  padding: 0;
  transition: color 0.3s ease;
  z-index: 2;
}

.password-toggle:hover {
  color: white;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  font-size: 13px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}

.checkbox-label input {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(20, 20, 20, 0.8);
  cursor: pointer;
  accent-color: var(--lava, #FF3D00);
}

.checkbox-label:hover {
  color: rgba(255, 255, 255, 0.7);
}

.forgot-link {
  color: var(--electric, #00F0FF);
  text-decoration: none;
  transition: all 0.3s ease;
}

.forgot-link:hover {
  color: var(--electric-glow, #4DFFFF);
  text-shadow: 0 0 15px rgba(0, 240, 255, 0.6);
}

.error-message {
  color: #FF3D00;
  font-size: 13px;
  margin-bottom: 16px;
  text-align: center;
}

.form .btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--lava, #FF3D00), var(--lava-glow, #FF6B35));
  color: white;
  border: none;
  border-radius: 12px;
  font-family: 'Manrope', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 4px 20px rgba(255, 61, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.form .btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.25), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.form .btn:hover::before {
  transform: translateX(100%);
}

.form .btn:hover {
  box-shadow:
    0 8px 35px rgba(255, 61, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.form .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 分隔线 */
.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 32px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
}

.divider span {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

/* 第三方登录 */
.social-login {
  text-align: center;
}

.social-login p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  margin-bottom: 16px;
}

.social-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.social-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.social-btn:hover:not(.disabled) {
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-4px);
  background: rgba(20, 20, 20, 0.9);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

.social-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.social-btn svg {
  width: 24px;
  height: 24px;
}

.social-btn span {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.social-btn:hover:not(.disabled) span {
  color: white;
}

/* 返回链接 */
.back-link-wrapper {
  text-align: center;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 14px;
  margin-top: 24px;
  transition: all 0.3s ease;
}

.back-link:hover {
  color: white;
}

.agree-text {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 24px;
}

.agree-text input {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: var(--lava, #FF3D00);
}

.agree-text label {
  color: rgba(255, 255, 255, 0.5);
}

.agree-text a {
  color: var(--electric, #00F0FF);
  text-decoration: none;
  transition: all 0.3s ease;
}

.agree-text a:hover {
  color: var(--electric-glow, #4DFFFF);
  text-shadow: 0 0 15px rgba(0, 240, 255, 0.6);
}

/* CSS 变量 */
:deep(:root) {
  --void: #0a0a0a;
  --void-light: #141414;
  --lava: #FF3D00;
  --lava-glow: #FF6B35;
  --electric: #00F0FF;
  --electric-glow: #4DFFFF;
}

/* 响应式 */
@media (max-width: 480px) {
  .auth-card {
    padding: 24px;
  }

  .logo-section h1 {
    font-size: 24px;
  }

  .social-buttons {
    gap: 8px;
  }

  .social-btn {
    padding: 12px 8px;
  }
}
</style>
