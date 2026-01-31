/**
 * useImageCompressor - 图片压缩 Composable
 *
 * 使用 Canvas API 在前端压缩图片，减少上传带宽消耗
 *
 * @param {Object} options - 配置选项
 * @param {number} options.maxWidth - 最大宽度，默认 1920
 * @param {number} options.maxHeight - 最大高度，默认 1080
 * @param {number} options.quality - 压缩质量 0-1，默认 0.85
 * @param {number} options.maxSizeMB - 最大文件大小(MB)，超过则进一步压缩，默认 5
 * @returns {Object} 压缩相关方法
 */
import { ref } from 'vue'

export function useImageCompressor(options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    maxFileSize = 5 * 1024 * 1024 // 5MB
  } = options

  // 压缩状态
  const isCompressing = ref(false)
  const compressionProgress = ref(0)
  const originalSize = ref(0)
  const compressedSize = ref(0)

  /**
   * 压缩单个文件
   * @param {File} file - 原始文件
   * @param {Object} options - 覆盖默认配置
   * @returns {Promise<{file: File, blob: Blob, dataUrl: string}>}
   */
  async function compressFile(file, options = {}) {
    const {
      maxWidth: customMaxWidth = maxWidth,
      maxHeight: customMaxHeight = maxHeight,
      quality: customQuality = quality
    } = options

    isCompressing.value = true
    compressionProgress.value = 0
    originalSize.value = file.size

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const img = new Image()

        img.onload = () => {
          compressionProgress.value = 30

          // 计算压缩后的尺寸
          let width = img.width
          let height = img.height

          // 按比例缩放
          if (width > customMaxWidth || height > customMaxHeight) {
            const ratio = Math.min(customMaxWidth / width, customMaxHeight / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }

          // 创建 canvas 进行压缩
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')

          // 启用图像平滑
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          // 绘制图片
          ctx.drawImage(img, 0, 0, width, height)

          compressionProgress.value = 60

          // 转换为 Blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                isCompressing.value = false
                reject(new Error('图片压缩失败'))
                return
              }

              compressionProgress.value = 80
              compressedSize.value = blob.size

              // 创建新的 File 对象
              const compressedFile = new File(
                [blob],
                file.name,
                { type: 'image/jpeg', lastModified: Date.now() }
              )

              // 生成 Data URL
              const reader = new FileReader()
              reader.onload = (e) => {
                compressionProgress.value = 100
                isCompressing.value = false

                resolve({
                  file: compressedFile,
                  blob: blob,
                  dataUrl: e.target.result,
                  originalWidth: img.width,
                  originalHeight: img.height,
                  compressedWidth: width,
                  compressedHeight: height
                })
              }
              reader.onerror = () => {
                isCompressing.value = false
                reject(new Error('生成 DataURL 失败'))
              }
              reader.readAsDataURL(blob)
            },
            'image/jpeg',
            customQuality
          )
        }

        img.onerror = () => {
          isCompressing.value = false
          reject(new Error('图片加载失败'))
        }

        img.src = e.target.result
      }

      reader.onerror = () => {
        isCompressing.value = false
        reject(new Error('文件读取失败'))
      }

      reader.readAsDataURL(file)
    })
  }

  /**
   * 智能压缩 - 自动调整质量直到满足文件大小要求
   * @param {File} file - 原始文件
   * @param {Object} options - 配置选项
   * @returns {Promise<{file: File, blob: Blob, dataUrl: string}>}
   */
  async function smartCompress(file, options = {}) {
    const {
      targetSize = maxFileSize,
      minWidth = 800,
      minHeight = 600,
      initialQuality = 0.85,
      qualityStep = 0.1,
      minQuality = 0.5
    } = options

    isCompressing.value = true
    originalSize.value = file.size

    // 如果文件已经足够小，直接返回
    if (file.size <= targetSize) {
      isCompressing.value = false
      return {
        file: file,
        blob: file,
        skipped: true
      }
    }

    let currentQuality = initialQuality
    let currentMaxWidth = maxWidth
    let currentMaxHeight = maxHeight
    let result = null

    // 逐步降低质量和尺寸
    while (currentQuality >= minQuality) {
      try {
        result = await compressFile(file, {
          maxWidth: currentMaxWidth,
          maxHeight: currentMaxHeight,
          quality: currentQuality
        })

        // 检查是否满足大小要求
        if (result.file.size <= targetSize) {
          compressedSize.value = result.file.size
          isCompressing.value = false
          return { ...result, skipped: false }
        }

        // 如果质量足够低但仍然太大，降低尺寸
        if (currentQuality <= minQuality) {
          currentMaxWidth = Math.max(minWidth, Math.round(currentMaxWidth * 0.8))
          currentMaxHeight = Math.max(minHeight, Math.round(currentMaxHeight * 0.8))
          currentQuality = initialQuality // 重置质量
        } else {
          currentQuality = Math.max(minQuality, currentQuality - qualityStep)
        }

        // 如果尺寸已经降到最小，返回当前结果
        if (currentMaxWidth <= minWidth && currentMaxHeight <= minHeight && currentQuality <= minQuality) {
          compressedSize.value = result.file.size
          isCompressing.value = false
          return { ...result, skipped: false }
        }
      } catch (error) {
        isCompressing.value = false
        throw error
      }
    }

    isCompressing.value = false
    return result
  }

  /**
   * 批量压缩多个文件
   * @param {File[]} files - 文件数组
   * @param {Object} options - 配置选项
   * @returns {Promise<Array<{file: File, blob: Blob, dataUrl: string}>>}
   */
  async function compressBatch(files, options = {}) {
    const results = []
    const total = files.length

    for (let i = 0; i < total; i++) {
      try {
        const result = await smartCompress(files[i], options)
        results.push(result)
        compressionProgress.value = Math.round(((i + 1) / total) * 100)
      } catch (error) {
        results.push({ error, originalFile: files[i] })
      }
    }

    return results
  }

  /**
   * 获取图片信息
   * @param {File} file - 图片文件
   * @returns {Promise<{width: number, height: number}>}
   */
  function getImageInfo(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          resolve({ width: img.width, height: img.height })
        }
        img.onerror = reject
        img.src = e.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string}
   */
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  /**
   * 计算压缩率
   * @returns {number} 压缩百分比
   */
  function getCompressionRatio() {
    if (originalSize.value === 0) return 0
    return Math.round((1 - compressedSize.value / originalSize.value) * 100)
  }

  /**
   * 重置状态
   */
  function reset() {
    isCompressing.value = false
    compressionProgress.value = 0
    originalSize.value = 0
    compressedSize.value = 0
  }

  return {
    // 状态
    isCompressing,
    compressionProgress,
    originalSize,
    compressedSize,

    // 方法
    compressFile,
    smartCompress,
    compressBatch,
    getImageInfo,
    formatSize,
    getCompressionRatio,
    reset
  }
}

/**
 * 创建图片预览
 * @param {File} file - 图片文件
 * @returns {Promise<string>} DataURL
 */
export function createImagePreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
