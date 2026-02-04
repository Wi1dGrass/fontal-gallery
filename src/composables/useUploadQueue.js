/**
 * 上传队列管理
 * 支持批量上传、空间选择、图片信息编辑
 */
import { ref, computed } from 'vue'
import { uploadPicture, uploadPictureByUrl, updatePicture, getMySpace } from '@/config/api.js'

/**
 * 生成临时ID
 */
function generateTempId() {
  return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

/**
 * 上传队列管理
 */
export function useUploadQueue() {
  // ========== 状态 ==========
  const queue = ref([])  // 上传队列
  const selectedSpace = ref(null)  // 选中的空间 (null = 公共空间)
  const personalSpace = ref(null)  // 用户的个人空间
  const isUploading = ref(false)
  const uploadProgress = ref(0)

  // ========== 加载个人空间 ==========
  async function fetchPersonalSpace() {
    try {
      const result = await getMySpace()
      if (result.code === 0 && result.data) {
        personalSpace.value = {
          ...result.data,
          id: String(result.data.id)
        }
      }
    } catch (error) {
      console.error('获取个人空间失败:', error)
    }
  }

  // ========== 队列操作 ==========

  /**
   * 从文件添加到队列
   */
  function addFromFiles(files) {
    const fileArray = Array.from(files)
    const newItems = fileArray.map(file => {
      const tempId = generateTempId()
      // 创建本地预览URL
      const preview = URL.createObjectURL(file)

      return {
        id: tempId,
        source: 'local',
        status: 'pending',  // pending | uploading | ready | error
        preview,
        file,
        url: null,

        // 图片信息（用户编辑）
        name: file.name.replace(/\.[^/.]+$/, ''),  // 去除扩展名
        category: '',
        tags: [],
        introduction: '',

        // 上传后信息
        pictureId: null,
        reviewStatus: null,
        error: null
      }
    })

    queue.value.push(...newItems)
    return newItems
  }

  /**
   * 从URL添加到队列
   */
  async function addFromUrl(url) {
    const tempId = generateTempId()

    const item = {
      id: tempId,
      source: 'url',
      status: 'pending',
      preview: url,  // 先用URL作为预览
      file: null,
      url,

      // 图片信息
      name: '',
      category: '',
      tags: [],
      introduction: '',

      // 上传后信息
      pictureId: null,
      reviewStatus: null,
      error: null
    }

    queue.value.push(item)
    return item
  }

  /**
   * 从个人空间添加到队列
   */
  function addFromSpace(picture) {
    const tempId = generateTempId()

    const item = {
      id: tempId,
      source: 'space',
      status: 'ready',  // 从空间选择的图片已经上传过了
      preview: picture.url,
      file: null,
      url: null,
      spacePictureId: picture.id,

      // 图片信息（预填已有信息）
      name: picture.name || '',
      category: picture.category || '',
      tags: picture.tags ? (Array.isArray(picture.tags) ? picture.tags : []) : [],
      introduction: picture.introduction || '',

      // 上传后信息
      pictureId: picture.id,
      reviewStatus: picture.reviewStatus,
      error: null
    }

    queue.value.push(item)
    return item
  }

  /**
   * 从队列移除
   */
  function removeItem(id) {
    const index = queue.value.findIndex(item => item.id === id)
    if (index > -1) {
      const item = queue.value[index]
      // 清理Blob URL
      if (item.source === 'local' && item.preview) {
        URL.revokeObjectURL(item.preview)
      }
      queue.value.splice(index, 1)
    }
  }

  /**
   * 清空队列
   */
  function clearQueue() {
    // 清理所有Blob URLs
    queue.value.forEach(item => {
      if (item.source === 'local' && item.preview) {
        URL.revokeObjectURL(item.preview)
      }
    })
    queue.value = []
  }

  /**
   * 更新队列项信息
   */
  function updateItem(id, data) {
    const item = queue.value.find(item => item.id === id)
    if (item) {
      Object.assign(item, data)
    }
  }

  /**
   * 获取选中项
   */
  const selectedItems = computed(() => {
    return queue.value.filter(item => item.selected)
  })

  /**
   * 全选/取消全选
   */
  function toggleSelectAll(select) {
    queue.value.forEach(item => {
      item.selected = select
    })
  }

  // ========== 上传操作 ==========

  /**
   * 上传单个项目
   * 流程：先上传文件获取 pictureId，再调用 updatePicture 更新图片信息
   */
  async function uploadItem(item) {
    if (item.status === 'ready') return  // 已上传的跳过

    item.status = 'uploading'
    item.error = null

    try {
      let result

      // 第一步：上传文件
      if (item.source === 'local') {
        result = await uploadPicture(item.file, {
          spaceId: selectedSpace.value?.id ?? 0
        })
      } else if (item.source === 'url') {
        result = await uploadPictureByUrl(item.url, {
          spaceId: selectedSpace.value?.id ?? 0
        })
      }

      if (result.code === 0 && result.data) {
        item.pictureId = result.data.id
        item.preview = result.data.url || item.preview

        // 第二步：更新图片信息（如果有填写）
        if (item.name || item.category || item.tags?.length || item.introduction) {
          await updateItemMetadata(item)
        }

        item.status = 'ready'
      } else {
        throw new Error(result.message || '上传失败')
      }
    } catch (error) {
      item.status = 'error'
      item.error = error.message
      throw error
    }
  }

  /**
   * 更新图片元数据
   */
  async function updateItemMetadata(item) {
    if (!item.pictureId) return

    try {
      const result = await updatePicture({
        id: item.pictureId,
        name: item.name,
        category: item.category,
        tags: item.tags,
        introduction: item.introduction
      })

      if (result.code === 0) {
        return true
      } else {
        throw new Error(result.message || '更新失败')
      }
    } catch (error) {
      item.error = error.message
      throw error
    }
  }

  /**
   * 批量上传
   */
  async function uploadAll() {
    if (isUploading.value) return

    const pendingItems = queue.value.filter(
      item => item.status === 'pending' || item.status === 'error'
    )

    if (pendingItems.length === 0) return

    isUploading.value = true
    uploadProgress.value = 0

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i]
      try {
        await uploadItem(item)
        successCount++
      } catch (error) {
        failCount++
      }
      uploadProgress.value = ((i + 1) / pendingItems.length) * 100
    }

    isUploading.value = false

    return {
      total: pendingItems.length,
      success: successCount,
      fail: failCount
    }
  }

  /**
   * 仅提交元数据（对于已上传的图片）
   */
  async function submitMetadata() {
    const readyItems = queue.value.filter(item => item.status === 'ready')

    if (readyItems.length === 0) return

    for (const item of readyItems) {
      if (item.name || item.category || item.tags?.length || item.introduction) {
        try {
          await updateItemMetadata(item)
        } catch (error) {
          console.error('更新元数据失败:', error)
        }
      }
    }
  }

  // ========== 批量操作 ==========

  /**
   * 批量设置分类
   */
  function batchSetCategory(category) {
    queue.value.forEach(item => {
      if (item.selected) {
        item.category = category
      }
    })
  }

  /**
   * 批量添加标签
   */
  function batchAddTags(tags) {
    queue.value.forEach(item => {
      if (item.selected) {
        const existingTags = item.tags || []
        tags.forEach(tag => {
          if (!existingTags.includes(tag)) {
            existingTags.push(tag)
          }
        })
      }
    })
  }

  /**
   * 批量删除
   */
  function batchDelete() {
    queue.value = queue.value.filter(item => !item.selected)
  }

  // ========== 计算属性 ==========

  const queueStats = computed(() => {
    const total = queue.value.length
    const pending = queue.value.filter(item => item.status === 'pending').length
    const uploading = queue.value.filter(item => item.status === 'uploading').length
    const ready = queue.value.filter(item => item.status === 'ready').length
    const error = queue.value.filter(item => item.status === 'error').length

    return { total, pending, uploading, ready, error }
  })

  const canUpload = computed(() => {
    return queue.value.some(item =>
      item.status === 'pending' || item.status === 'error'
    ) && !isUploading.value
  })

  const selectedCount = computed(() => {
    return queue.value.filter(item => item.selected).length
  })

  // ========== 空间操作 ==========

  /**
   * 选择空间
   */
  function selectSpace(space) {
    selectedSpace.value = space
  }

  /**
   * 获取当前空间ID (用于上传)
   */
  const currentSpaceId = computed(() => {
    return selectedSpace.value?.id || 0
  })

  return {
    // 状态
    queue,
    selectedSpace,
    personalSpace,
    isUploading,
    uploadProgress,
    queueStats,
    canUpload,
    selectedCount,
    currentSpaceId,

    // 队列操作
    fetchPersonalSpace,
    addFromFiles,
    addFromUrl,
    addFromSpace,
    removeItem,
    clearQueue,
    updateItem,
    toggleSelectAll,

    // 上传操作
    uploadItem,
    uploadAll,
    submitMetadata,

    // 批量操作
    batchSetCategory,
    batchAddTags,
    batchDelete,

    // 空间操作
    selectSpace
  }
}
