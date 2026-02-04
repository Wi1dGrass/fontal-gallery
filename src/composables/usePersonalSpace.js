/**
 * 个人空间状态管理
 */
import { ref, computed } from 'vue'
import { API_BASE_URL, getMySpace } from '@/config/api.js'

// 空间等级配置
export const SPACE_LEVELS = {
  COMMON: {
    value: 0,
    name: '普通版',
    maxSize: 100 * 1024 * 1024,  // 100 MB
    maxCount: 100,
    desc: '适合日常使用'
  },
  PROFESSIONAL: {
    value: 1,
    name: '专业版',
    maxSize: 1000 * 1024 * 1024,  // 1000 MB (1 GB)
    maxCount: 1000,
    desc: '海量存储空间'
  }
}

/**
 * 格式化字节大小
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * 个人空间状态管理
 */
export function usePersonalSpace() {
  // ========== 状态 ==========
  const space = ref(null)  // 空间信息
  const pictures = ref([])  // 图片列表
  const loading = ref(false)
  const error = ref(null)

  // 分页
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const hasMore = computed(() => pictures.value.length < total.value)

  // 选择状态
  const selectedIds = ref(new Set())
  const isSelectMode = computed(() => selectedIds.value.size > 0)

  // 上传状态
  const uploading = ref(false)
  const uploadProgress = ref(0)

  // ========== API 方法 ==========

  /**
   * 获取用户的个人空间
   */
  async function fetchUserSpace() {
    loading.value = true
    error.value = null

    try {
      // 使用新的 getMySpace 接口直接获取用户的个人空间
      const result = await getMySpace()

      if (result.code === 0 && result.data) {
        // 确保 ID 以字符串形式存储
        space.value = {
          ...result.data,
          id: String(result.data.id)
        }
        return space.value.id
      } else {
        space.value = null
        return null
      }
    } catch (err) {
      // 如果接口返回 404 或没有数据，说明用户还没有创建空间
      if (err.message?.includes('404') || err.message?.includes('没有空间')) {
        space.value = null
        return null
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 根据 ID 获取空间详情
   */
  async function fetchSpaceById(spaceId) {
    loading.value = true
    error.value = null

    try {
      // 使用 URLSearchParams 正确传递 Long 类型 ID
      const params = new URLSearchParams({ id: String(spaceId) })
      const response = await fetch(`${API_BASE_URL}/space/get/vo?${params}`, {
        credentials: 'include'
      })

      const result = await response.json()

      if (result.code === 0) {
        // 确保 ID 以字符串形式存储
        space.value = {
          ...result.data,
          id: String(result.data.id)
        }
        return result.data
      } else {
        throw new Error(result.message || '获取空间详情失败')
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建空间
   */
  async function createSpace(spaceName, spaceLevel) {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE_URL}/space/add`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceName, spaceLevel })
      })

      const result = await response.json()

      if (result.code === 0) {
        const spaceId = result.data
        // 创建成功后获取详情
        await fetchSpaceById(spaceId)
        return spaceId
      } else {
        throw new Error(result.message || '创建空间失败')
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 编辑空间名称
   */
  async function updateSpaceName(spaceId, spaceName) {
    try {
      const response = await fetch(`${API_BASE_URL}/space/edit`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: spaceId, spaceName })
      })

      const result = await response.json()

      if (result.code === 0) {
        // 更新本地状态
        if (space.value) {
          space.value.spaceName = spaceName
        }
        return true
      } else {
        throw new Error(result.message || '修改空间名称失败')
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  /**
   * 获取空间内的图片列表
   */
  async function fetchPictures(spaceId, page = 1, reset = false) {
    if (reset) {
      currentPage.value = 1
      pictures.value = []
    }

    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE_URL}/picture/list/page/vo`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current: page,
          pageSize: pageSize.value,
          spaceId: spaceId
        })
      })

      const result = await response.json()

      if (result.code === 0) {
        const newPictures = result.data.records || []
        if (reset) {
          pictures.value = newPictures
        } else {
          pictures.value = [...pictures.value, ...newPictures]
        }
        total.value = result.data.total || 0
        currentPage.value = page
        return newPictures
      } else {
        throw new Error(result.message || '获取图片列表失败')
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 上传图片到空间
   */
  async function uploadPicture(file, spaceId) {
    uploading.value = true
    uploadProgress.value = 0

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('spaceId', spaceId)

      const response = await fetch(`${API_BASE_URL}/picture/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      const result = await response.json()

      if (result.code === 0) {
        // 上传成功，刷新空间详情和图片列表
        await Promise.all([
          fetchSpaceById(spaceId),
          fetchPictures(spaceId, 1, true)
        ])
        uploadProgress.value = 100
        return result.data
      } else {
        throw new Error(result.message || '上传失败')
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      uploading.value = false
      uploadProgress.value = 0
    }
  }

  /**
   * 批量删除图片
   */
  async function deletePictures(spaceId, ids) {
    loading.value = true

    try {
      // 逐个删除
      for (const id of ids) {
        const response = await fetch(`${API_BASE_URL}/picture/delete`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        })

        const result = await response.json()
        if (result.code !== 0) {
          throw new Error(`删除图片 ${id} 失败: ${result.message}`)
        }
      }

      // 删除成功后刷新
      await Promise.all([
        fetchSpaceById(spaceId),
        fetchPictures(spaceId, 1, true)
      ])

      // 清空选择
      selectedIds.value.clear()

      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // ========== 选择操作 ==========

  /**
   * 切换选中状态
   */
  function toggleSelect(id) {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id)
    } else {
      selectedIds.value.add(id)
    }
  }

  /**
   * 全选/取消全选
   */
  function toggleSelectAll() {
    if (selectedIds.value.size === pictures.value.length) {
      // 全部选中，取消全选
      selectedIds.value.clear()
    } else {
      // 全选
      pictures.value.forEach(p => selectedIds.value.add(p.id))
    }
  }

  /**
   * 清空选择
   */
  function clearSelection() {
    selectedIds.value.clear()
  }

  // ========== 计算属性 ==========

  /**
   * 存储使用百分比
   */
  const storagePercent = computed(() => {
    if (!space.value) return 0
    return Math.min(100, (space.value.totalSize / space.value.maxSize) * 100)
  })

  /**
   * 存储使用状态
   */
  const storageStatus = computed(() => {
    const percent = storagePercent.value
    if (percent >= 90) return { type: 'danger', text: '空间不足' }
    if (percent >= 70) return { type: 'warning', text: '空间紧张' }
    return { type: 'normal', text: '充足' }
  })

  /**
   * 空间等级信息
   */
  const spaceLevelInfo = computed(() => {
    if (!space.value) return null
    return space.value.spaceLevel === 1 ? SPACE_LEVELS.PROFESSIONAL : SPACE_LEVELS.COMMON
  })

  return {
    // 状态
    space,
    pictures,
    loading,
    error,
    currentPage,
    pageSize,
    total,
    hasMore,
    selectedIds,
    isSelectMode,
    uploading,
    uploadProgress,
    storagePercent,
    storageStatus,
    spaceLevelInfo,

    // 方法
    fetchUserSpace,
    fetchSpaceById,
    createSpace,
    updateSpaceName,
    fetchPictures,
    uploadPicture,
    deletePictures,
    toggleSelect,
    toggleSelectAll,
    clearSelection
  }
}
