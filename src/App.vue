<template>
  <!-- 星空背景层 -->
  <div class="stars-layer"></div>

  <!-- 独立登录页面（无导航栏） -->
  <router-view v-if="isAuthPage" />

  <!-- 主布局（需要登录） -->
  <div v-else class="min-h-screen bg-noise">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div class="flex items-center justify-between px-4 lg:px-8 h-16">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-lava to-orange-500 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span class="font-display font-bold text-xl">FON Gallery</span>
        </router-link>

        <!-- 搜索框 -->
        <div class="hidden md:flex relative">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
          <input type="text" placeholder="搜索图片..." class="w-80 pl-12 pr-4 py-2.5 bg-void-light border border-white/10 rounded-xl text-sm focus:outline-none focus:border-lava/50" />
        </div>

        <!-- 右侧操作 -->
        <div class="flex items-center gap-3">
          <button class="btn btn-ghost p-2">
            <Bell class="w-5 h-5" />
          </button>
          <router-link to="/upload" class="btn btn-primary">
            <Upload class="w-4 h-4" />
            上传
          </router-link>
          <UserDropdown />
        </div>
      </div>
    </header>

    <div class="flex pt-16">
      <!-- 侧边栏 -->
      <aside class="hidden lg:block fixed left-0 top-16 bottom-0 w-64 glass-strong border-r border-white/5 p-4">
        <nav class="space-y-1">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-item flex items-center gap-3"
            :class="$route.path === item.path ? 'nav-item-active' : 'nav-item-inactive'"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span class="font-medium">{{ item.label }}</span>
            <span v-if="item.badge" class="ml-auto px-2 py-0.5 bg-lava/20 text-lava text-xs rounded-full">{{ item.badge }}</span>
          </router-link>
        </nav>

        <div class="absolute bottom-4 left-4 right-4 pt-4 border-t border-white/5">
          <router-link to="/settings" class="nav-item nav-item-inactive">
            <Settings class="w-5 h-5" />
            <span class="font-medium">设置</span>
          </router-link>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="flex-1 lg:ml-64 p-4 lg:p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Bell, Upload, Home, Shield, User, Users, Settings } from 'lucide-vue-next'
import UserDropdown from './components/UserDropdown.vue'
import { API_BASE_URL } from '@/config/api.js'

const route = useRoute()
const currentUser = ref(null)

// 判断是否是登录页面（独立布局）
const isAuthPage = computed(() => route.path === '/auth')

// 导航菜单项
const allNavItems = [
  { path: '/', label: '公共图库', icon: Home, desc: '浏览和检索公开图片' },
  { path: '/admin', label: '管理后台', icon: Shield, desc: '审核、管理和分析', adminOnly: true },
  { path: '/personal', label: '个人空间', icon: User, desc: '私有图片管理' },
  { path: '/team', label: '团队空间', icon: Users, desc: '团队协作编辑' },
]

// 根据用户角色过滤导航菜单
const navItems = computed(() => {
  return allNavItems.filter(item => {
    if (item.adminOnly) {
      return currentUser.value?.userRole === 'admin'
    }
    return true
  })
})

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
    // 静默处理
  }
}

onMounted(() => {
  fetchCurrentUser()
})
</script>
