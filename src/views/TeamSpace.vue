<template>
  <div class="space-y-8 animate-fade-in">
    <!-- 头部 -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-4xl font-bold mb-2">团队空间</h1>
        <p class="text-white/50">实时协作，与团队一起创作</p>
      </div>
      <button class="btn btn-electric">
        <Users class="w-4 h-4" />
        创建团队
      </button>
    </div>

    <!-- 团队卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        v-for="team in teams"
        :key="team.id"
        class="card p-6 cursor-pointer transition-all hover:-translate-y-1"
        :class="selectedTeam === team.id ? 'border-lava/50' : ''"
        @click="selectedTeam = team.id"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-display font-bold"
               :class="team.color">
            {{ team.name[0] }}
          </div>
          <span class="px-3 py-1 rounded-full text-xs"
                :class="team.role === '所有者' ? 'bg-lava/20 text-lava' : 'bg-white/10 text-white/60'">
            {{ team.role }}
          </span>
        </div>
        <h3 class="font-display font-semibold text-lg mb-2">{{ team.name }}</h3>
        <div class="flex items-center gap-4 text-white/40 text-sm">
          <span class="flex items-center gap-1">
            <Users class="w-4 h-4" />
            {{ team.members }}
          </span>
          <span class="flex items-center gap-1">
            <Image class="w-4 h-4" />
            {{ team.images }}
          </span>
        </div>
      </div>
    </div>

    <!-- 实时协作提示 -->
    <div class="card p-4 bg-gradient-to-r from-electric/10 to-cyan-500/10 border-electric/20">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-electric/20 rounded-xl flex items-center justify-center">
          <Video class="w-6 h-6 text-electric" />
        </div>
        <div class="flex-1">
          <p class="font-medium">实时协作已启用</p>
          <p class="text-white/40 text-sm">3 位成员正在编辑中</p>
        </div>
        <div class="flex -space-x-2">
          <div v-for="i in 3" :key="i" class="w-9 h-9 rounded-full border-2 border-void flex items-center justify-center text-sm font-medium"
               :class="['bg-lava', 'bg-electric', 'bg-purple-500'][i - 1]">
            {{ ['张', '李', '王'][i - 1] }}
          </div>
        </div>
      </div>
    </div>

    <!-- 团队图片 -->
    <div>
      <h2 class="font-display font-semibold mb-4">共享文件</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="img in teamImages"
          :key="img.id"
          class="card card-hover group cursor-pointer"
        >
          <div class="relative aspect-[4/3]">
            <img :src="img.url" class="w-full h-full object-cover" />
            <!-- 编辑状态 -->
            <div v-if="img.status === 'editing'" class="absolute top-3 left-3 px-2 py-1 bg-red-500/80 text-white text-xs rounded-full flex items-center gap-1">
              <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              编辑中
            </div>
            <!-- 查看者头像 -->
            <div v-if="img.viewers > 0" class="absolute top-3 right-3 flex -space-x-1">
              <div v-for="i in Math.min(img.viewers, 2)" :key="i" class="w-6 h-6 bg-electric rounded-full border border-void"></div>
            </div>
            <!-- 悬停操作 -->
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button class="w-12 h-12 bg-electric text-void rounded-xl flex items-center justify-center">
                <Edit class="w-6 h-6" />
              </button>
            </div>
          </div>
          <div class="p-3">
            <p class="font-medium truncate text-sm">{{ img.title }}</p>
            <p class="text-white/40 text-xs flex items-center gap-1 mt-1">
              <MessageCircle class="w-3 h-3" />
              {{ img.comments }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 团队成员 -->
    <div class="card">
      <div class="p-5 border-b border-white/5">
        <h2 class="font-display font-semibold">团队成员</h2>
      </div>
      <div class="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="member in members" :key="member.id" class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
          <div class="relative">
            <div class="w-10 h-10 bg-gradient-to-br from-lava to-orange-500 rounded-full flex items-center justify-center font-medium">
              {{ member.name[0] }}
            </div>
            <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-void"
                 :class="member.online ? 'bg-green-500' : 'bg-white/20'"></div>
          </div>
          <div>
            <p class="font-medium text-sm">{{ member.name }}</p>
            <p class="text-white/40 text-xs">{{ member.role }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Users, Image, Video, Edit, MessageCircle, UserPlus } from 'lucide-vue-next'

const selectedTeam = ref(1)

const teams = [
  { id: 1, name: '设计团队', members: 12, images: 345, role: '所有者', color: 'bg-gradient-to-br from-lava to-orange-500' },
  { id: 2, name: '市场部', members: 8, images: 156, role: '管理员', color: 'bg-gradient-to-br from-electric to-cyan-500' },
  { id: 3, name: '产品组', members: 15, images: 523, role: '成员', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
]

const teamImages = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  url: `https://picsum.photos/400/300?random=${i + 40}`,
  title: ['首页设计V2', '产品宣传图', '活动海报', 'UI组件库', '品牌手册', 'App图标', '启动页', 'Banner图'][i],
  status: ['editing', 'viewing', 'idle'][i % 3],
  viewers: [3, 1, 0, 2, 0, 1, 0, 0][i],
  comments: [5, 12, 3, 8, 0, 15, 2, 7][i],
}))

const members = [
  { id: 1, name: '张三', role: '所有者', online: true },
  { id: 2, name: '李四', role: '管理员', online: true },
  { id: 3, name: '王五', role: '成员', online: false },
  { id: 4, name: '赵六', role: '成员', online: true },
]
</script>
