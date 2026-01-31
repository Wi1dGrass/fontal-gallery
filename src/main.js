import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// 导入配置
import { API_BASE_URL } from './config/api.js'
import { AUTH_CACHE_DURATION } from './config/constants.js'

// 路由配置
const routes = [
  { path: '/', name: 'PublicGallery', component: () => import('./views/PublicGallery.vue') },
  { path: '/picture/:id', name: 'PictureDetail', component: () => import('./views/PictureDetailView.vue') },
  { path: '/auth', name: 'Auth', component: () => import('./views/AuthView.vue'), meta: { requiresAuth: false } },
  { path: '/settings', name: 'Settings', component: () => import('./views/SettingsView.vue'), meta: { requiresAuth: true } },
  { path: '/admin', name: 'AdminDashboard', component: () => import('./views/AdminDashboard.vue'), meta: { requiresAuth: true } },
  { path: '/personal', name: 'PersonalSpace', component: () => import('./views/PersonalSpace.vue'), meta: { requiresAuth: true } },
  { path: '/team', name: 'TeamSpace', component: () => import('./views/TeamSpace.vue'), meta: { requiresAuth: true } },
  { path: '/user/:userId', name: 'UserDetail', component: () => import('./views/UserDetailView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置（如浏览器后退），返回到保存的位置
    if (savedPosition) {
      return savedPosition
    }
    // 否则滚动到页面顶部
    return { top: 0, behavior: 'smooth' }
  }
})

// 认证缓存
let authCache = {
  isLoggedIn: null,
  expiresAt: 0
}

/**
 * 检查登录状态（带缓存）
 */
async function checkAuth() {
  // 检查缓存是否有效
  if (Date.now() < authCache.expiresAt && authCache.isLoggedIn !== null) {
    return authCache.isLoggedIn
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/current`, {
      credentials: 'include'
    })
    const result = await response.json()
    const isLoggedIn = result.code === 0

    // 更新缓存
    authCache = {
      isLoggedIn,
      expiresAt: Date.now() + AUTH_CACHE_DURATION
    }

    return isLoggedIn
  } catch (error) {
    // 网络错误时，如果有有效缓存则使用缓存，否则返回 false
    if (Date.now() < authCache.expiresAt && authCache.isLoggedIn !== null) {
      return authCache.isLoggedIn
    }
    return false
  }
}

/**
 * 清除认证缓存（用于登出后）
 */
export function clearAuthCache() {
  authCache = {
    isLoggedIn: null,
    expiresAt: 0
  }
}

/**
 * 设置认证缓存为已登录（用于登录成功后）
 */
export function setLoggedInCache() {
  authCache = {
    isLoggedIn: true,
    expiresAt: Date.now() + AUTH_CACHE_DURATION
  }
}

// 路由守卫：检查登录状态
router.beforeEach(async (to, from, next) => {
  // 登录页特殊处理
  if (to.path === '/auth') {
    // 直接放行，不做检查（让登录页面自己处理）
    next()
    return
  }

  // 其他页面需要登录
  const isLoggedIn = await checkAuth()

  if (isLoggedIn) {
    next()
  } else {
    next('/auth')
  }
})

const app = createApp(App)
app.use(router)
app.mount('#app')
