<template>
  <div class="space-y-8 animate-fade-in">
    <!-- 头部 -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-4xl font-bold mb-2">个人空间</h1>
        <p class="text-white/50">你的私人图片库，安全存储与智能管理</p>
      </div>
      <div class="flex gap-3">
        <button class="btn btn-secondary">
          <FolderPlus class="w-4 h-4" />
          新建文件夹
        </button>
        <button class="btn btn-primary">
          <Upload class="w-4 h-4" />
          上传图片
        </button>
      </div>
    </div>

    <!-- 存储统计 -->
    <div class="card p-6 bg-gradient-to-r from-lava/20 to-orange-500/20 border-lava/20">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-white/40 text-sm">存储空间</p>
          <p class="font-display text-2xl font-bold mt-1">4.2 GB / 10 GB</p>
        </div>
        <div class="flex gap-8 text-center">
          <div>
            <p class="font-display text-2xl font-bold">{{ images.length }}</p>
            <p class="text-white/40 text-sm">图片</p>
          </div>
          <div>
            <p class="font-display text-2xl font-bold">4</p>
            <p class="text-white/40 text-sm">文件夹</p>
          </div>
        </div>
      </div>
      <div class="h-2 bg-void-lighter rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-lava to-orange-400 rounded-full" style="width: 42%"></div>
      </div>
    </div>

    <!-- 文件夹 -->
    <div>
      <h2 class="font-display font-semibold mb-4 flex items-center gap-2">
        <Folder class="w-5 h-5 text-electric" />
        文件夹
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="folder in folders"
          :key="folder.id"
          @click="selectedFolder = folder.name"
          class="card p-4 cursor-pointer transition-all hover:-translate-y-1"
          :class="selectedFolder === folder.name ? 'border-lava/50' : ''"
        >
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-lg overflow-hidden">
              <img :src="folder.cover" class="w-full h-full object-cover" />
            </div>
            <div>
              <p class="font-medium">{{ folder.name }}</p>
              <p class="text-white/40 text-sm">{{ folder.count }} 张</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片网格 -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-display font-semibold">我的图片</h2>
        <div class="flex gap-2">
          <button class="btn btn-ghost text-sm py-2">
            <Grid class="w-4 h-4" />
          </button>
          <button class="btn btn-ghost text-sm py-2">
            <List class="w-4 h-4" />
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="(img, i) in images"
          :key="img.id"
          class="card card-hover group cursor-pointer"
        >
          <div class="relative aspect-[4/3]">
            <img :src="img.url" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button class="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center hover:bg-electric hover:text-void">
                <Edit class="w-5 h-5" />
              </button>
              <button class="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center hover:bg-lava">
                <Trash2 class="w-5 h-5" />
              </button>
            </div>
            <div v-if="img.starred" class="absolute top-3 right-3">
              <Star class="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>
          </div>
          <div class="p-3">
            <p class="font-medium truncate text-sm">{{ img.title }}</p>
            <p class="text-white/40 text-xs">{{ img.size }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Upload, FolderPlus, Folder, Grid, List, Edit, Trash2, Star } from 'lucide-vue-next'

const selectedFolder = ref('全部')

const folders = [
  { id: 1, name: '旅行照片', count: 128, cover: 'https://picsum.photos/100/100?random=101' },
  { id: 2, name: '工作资料', count: 56, cover: 'https://picsum.photos/100/100?random=102' },
  { id: 3, name: '家庭相册', count: 234, cover: 'https://picsum.photos/100/100?random=103' },
  { id: 4, name: '设计素材', count: 89, cover: 'https://picsum.photos/100/100?random=104' },
]

const images = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  url: `https://picsum.photos/400/300?random=${i + 30}`,
  title: ['山顶日出', '会议记录', '生日派对', 'Logo设计', '海边日落', '产品原型', '春节聚餐', '海报设计'][i],
  size: ['2.3MB', '1.1MB', '3.2MB', '0.8MB', '2.8MB', '1.5MB', '4.1MB', '2.0MB'][i],
  starred: i % 3 === 0,
}))
</script>
