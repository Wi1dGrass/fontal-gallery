/**
 * 图片编辑工具
 * 使用 Canvas API 实现图片裁剪、旋转、翻转、滤镜、调整
 */
import { ref, computed } from 'vue'

/**
 * 图片编辑状态管理
 */
export function useImageEditor(imageSource) {
  // ========== 状态 ==========
  const canvas = ref(null)
  const ctx = ref(null)
  const originalImage = ref(null)
  const currentImage = ref(null)
  const isReady = ref(false)

  // 缓存画布尺寸
  const canvasWidth = ref(0)
  const canvasHeight = ref(0)

  // 编辑参数
  const rotation = ref(0)  // 旋转角度 (0, 90, 180, 270)
  const flipH = ref(false)  // 水平翻转
  const flipV = ref(false)  // 垂直翻转

  // 裁剪参数
  const cropMode = ref(null)  // null | 'free' | '1:1' | '4:3' | '16:9'
  const cropRect = ref({ x: 10, y: 10, width: 80, height: 80 })  // 百分比
  const isDragging = ref(false)
  const isResizing = ref(false)
  const resizeHandle = ref(null)  // 'nw' | 'ne' | 'sw' | 'se'
  const dragStart = ref({ x: 0, y: 0 })  // 鼠标起始位置
  const rectStart = ref({ x: 0, y: 0, width: 0, height: 0 })  // 拖拽起始时的矩形

  // 调整参数
  const brightness = ref(100)  // 0-200, 默认100
  const contrast = ref(100)    // 0-200, 默认100
  const saturation = ref(100)  // 0-200, 默认100

  // 滤镜预设
  const selectedFilter = ref('none')

  const filters = {
    none: { name: '原图', brightness: 100, contrast: 100, saturation: 100 },
    grayscale: { name: '黑白', brightness: 100, contrast: 100, saturation: 0 },
    vintage: { name: '复古', brightness: 110, contrast: 90, saturation: 80 },
    warm: { name: '暖色', brightness: 100, contrast: 100, saturation: 120 },
    cold: { name: '冷色', brightness: 100, contrast: 100, saturation: 80 },
    dramatic: { name: '戏剧', brightness: 90, contrast: 150, saturation: 120 },
    fade: { name: '褪色', brightness: 120, contrast: 80, saturation: 70 }
  }

  // ========== 初始化 ==========

  /**
   * 加载图片
   */
  async function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        originalImage.value = img
        currentImage.value = img
        isReady.value = true
        resetEdits()
        render()
        resolve(img)
      }

      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }

      img.src = src
    })
  }

  /**
   * 初始化 Canvas
   */
  function initCanvas(canvasEl) {
    canvas.value = canvasEl
    ctx.value = canvasEl.getContext('2d')

    // 添加鼠标事件监听
    canvasEl.addEventListener('mousedown', handleMouseDown)
    canvasEl.addEventListener('mousemove', handleMouseMove)
    canvasEl.addEventListener('mouseup', handleMouseUp)
    canvasEl.addEventListener('mouseleave', handleMouseUp)

    // 监听画布大小变化
    const resizeObserver = new ResizeObserver(() => {
      if (isReady.value) {
        render()
      }
    })
    resizeObserver.observe(canvasEl)

    return () => {
      resizeObserver.disconnect()
      canvasEl.removeEventListener('mousedown', handleMouseDown)
      canvasEl.removeEventListener('mousemove', handleMouseMove)
      canvasEl.removeEventListener('mouseup', handleMouseUp)
      canvasEl.removeEventListener('mouseleave', handleMouseUp)
    }
  }

  // ========== 渲染 ==========

  /**
   * 渲染图片到 Canvas
   */
  function render() {
    if (!canvas.value || !ctx.value || !originalImage.value) return

    const cvs = canvas.value
    const context = ctx.value
    const img = originalImage.value

    // 计算画布尺寸（保持宽高比）
    const containerWidth = cvs.parentElement.clientWidth
    const containerHeight = cvs.parentElement.clientHeight || 500

    let width = containerWidth
    let height = (img.height / img.width) * containerWidth

    if (height > containerHeight) {
      height = containerHeight
      width = (img.width / img.height) * containerHeight
    }

    canvasWidth.value = width
    canvasHeight.value = height
    cvs.width = width
    cvs.height = height

    // 清空画布
    context.clearRect(0, 0, width, height)
    context.save()

    // 应用滤镜
    const filter = filters[selectedFilter.value] || filters.none
    const finalBrightness = selectedFilter.value === 'none' ? brightness.value : filter.brightness
    const finalContrast = selectedFilter.value === 'none' ? contrast.value : filter.contrast
    const finalSaturation = selectedFilter.value === 'none' ? saturation.value : filter.saturation

    context.filter = `brightness(${finalBrightness}%) contrast(${finalContrast}%) saturate(${finalSaturation}%)`

    // 计算变换
    context.translate(width / 2, height / 2)

    // 应用旋转
    context.rotate((rotation.value * Math.PI) / 180)

    // 应用翻转
    context.scale(
      flipH.value ? -1 : 1,
      flipV.value ? -1 : 1
    )

    // 绘制图片
    const drawWidth = rotation.value % 180 === 0 ? width : height
    const drawHeight = rotation.value % 180 === 0 ? height : width

    context.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)

    context.restore()

    // 绘制裁剪框
    if (cropMode.value) {
      drawCropOverlay(context, width, height)
    }
  }

  /**
   * 绘制裁剪遮罩
   */
  function drawCropOverlay(context, width, height) {
    const { x, y, w, h } = getCropRectPixels(width, height)

    context.save()

    // 创建裁剪区域：只在裁剪框外部绘制遮罩
    context.beginPath()
    // 外圈矩形（顺时针）
    context.rect(0, 0, width, height)
    // 内圈矩形（逆时针，创建孔洞效果）
    context.rect(x + w, y, -w, h)
    context.clip('evenodd')

    // 绘制半透明遮罩（只会在裁剪框外部显示）
    context.fillStyle = 'rgba(0, 0, 0, 0.5)'
    context.fillRect(0, 0, width, height)

    context.restore()

    // 绘制裁剪框边框
    context.strokeStyle = '#fff'
    context.lineWidth = 2
    context.setLineDash([5, 5])
    context.strokeRect(x, y, w, h)

    // 绘制三分线
    context.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    context.lineWidth = 1
    context.setLineDash([])

    // 垂直线
    context.beginPath()
    context.moveTo(x + w / 3, y)
    context.lineTo(x + w / 3, y + h)
    context.moveTo(x + (w / 3) * 2, y)
    context.lineTo(x + (w / 3) * 2, y + h)
    context.stroke()

    // 水平线
    context.beginPath()
    context.moveTo(x, y + h / 3)
    context.lineTo(x + w, y + h / 3)
    context.moveTo(x, y + (h / 3) * 2)
    context.lineTo(x + w, y + (h / 3) * 2)
    context.stroke()

    // 绘制控制点
    const handleRadius = 8
    const handles = getCropHandles(x, y, w, h, handleRadius)

    context.fillStyle = '#fff'
    handles.forEach(handle => {
      context.beginPath()
      if (handle.cursor === 'move') {
        // 移动点 - 在中心画一个小圆点
        context.arc(handle.x, handle.y, 5, 0, Math.PI * 2)
      } else {
        // 角落控制点 - 圆形
        context.arc(handle.x, handle.y, handleRadius, 0, Math.PI * 2)
      }
      context.fill()
      context.strokeStyle = '#000'
      context.lineWidth = 2
      context.stroke()
    })
  }

  /**
   * 获取裁剪区域像素值
   */
  function getCropRectPixels(width, height) {
    let w = (cropRect.value.width / 100) * width
    let h = (cropRect.value.height / 100) * height
    let x = (cropRect.value.x / 100) * width
    let y = (cropRect.value.y / 100) * height

    // 保存原始中心点
    const centerX = x + w / 2
    const centerY = y + h / 2

    // 应用比例约束
    if (cropMode.value === '1:1') {
      const size = Math.max(w, h)
      w = size
      h = size
    } else if (cropMode.value === '4:3') {
      const ratio = 4 / 3
      if (w / h < ratio) {
        w = h * ratio
      } else {
        h = w / ratio
      }
    } else if (cropMode.value === '16:9') {
      const ratio = 16 / 9
      if (w / h < ratio) {
        w = h * ratio
      } else {
        h = w / ratio
      }
    }

    // 基于中心点重新计算位置
    x = centerX - w / 2
    y = centerY - h / 2

    // 边界检查 - 确保裁剪框不超出画布
    x = Math.max(0, Math.min(x, width - w))
    y = Math.max(0, Math.min(y, height - h))
    w = Math.min(w, width - x)
    h = Math.min(h, height - y)

    return { x, y, w, h }
  }

  /**
   * 获取控制点位置
   */
  function getCropHandles(x, y, w, h, radius = 8) {
    return [
      { x: x, y: y, cursor: 'nw-resize', handle: 'nw' },
      { x: x + w, y: y, cursor: 'ne-resize', handle: 'ne' },
      { x: x, y: y + h, cursor: 'sw-resize', handle: 'sw' },
      { x: x + w, y: y + h, cursor: 'se-resize', handle: 'se' },
      { x: x + w / 2, y: y + h / 2, cursor: 'move', handle: 'move' }
    ]
  }

  /**
   * 检测鼠标位置
   */
  function hitTest(mouseX, mouseY) {
    if (!cropMode.value || !canvasWidth.value || !canvasHeight.value) return null

    const { x, y, w, h } = getCropRectPixels(canvasWidth.value, canvasHeight.value)
    const handles = getCropHandles(x, y, w, h)
    const hitRadius = 12

    // 检查控制点
    for (const handle of handles) {
      const dx = mouseX - handle.x
      const dy = mouseY - handle.y
      if (dx * dx + dy * dy < hitRadius * hitRadius) {
        return handle
      }
    }

    // 检查是否在矩形内（用于移动）
    if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h) {
      return { handle: 'inside', cursor: 'move' }
    }

    return null
  }

  // ========== 鼠标事件处理 ==========

  /**
   * 鼠标按下
   */
  function handleMouseDown(e) {
    if (!cropMode.value || !canvas.value) return

    const rect = canvas.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const hit = hitTest(mouseX, mouseY)
    if (!hit) return

    if (hit.handle === 'inside' || hit.handle === 'move') {
      isDragging.value = true
    } else {
      isResizing.value = true
      resizeHandle.value = hit.handle
    }

    dragStart.value = { x: mouseX, y: mouseY }
    rectStart.value = { ...cropRect.value }

    e.preventDefault()
  }

  /**
   * 鼠标移动
   */
  function handleMouseMove(e) {
    if (!cropMode.value || !canvas.value) return

    const rect = canvas.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // 更新鼠标指针
    if (!isDragging.value && !isResizing.value) {
      const hit = hitTest(mouseX, mouseY)
      canvas.value.style.cursor = hit ? hit.cursor : 'default'
      return
    }

    // 处理拖拽
    if (isDragging.value) {
      const dx = mouseX - dragStart.value.x
      const dy = mouseY - dragStart.value.y

      const dxPercent = (dx / canvasWidth.value) * 100
      const dyPercent = (dy / canvasHeight.value) * 100

      cropRect.value.x = Math.max(0, Math.min(100 - cropRect.value.width, rectStart.value.x + dxPercent))
      cropRect.value.y = Math.max(0, Math.min(100 - cropRect.value.height, rectStart.value.y + dyPercent))

      render()
    }

    // 处理调整大小
    if (isResizing.value) {
      const dx = mouseX - dragStart.value.x
      const dy = mouseY - dragStart.value.y

      const dxPercent = (dx / canvasWidth.value) * 100
      const dyPercent = (dy / canvasHeight.value) * 100

      let newX = rectStart.value.x
      let newY = rectStart.value.y
      let newWidth = rectStart.value.width
      let newHeight = rectStart.value.height

      switch (resizeHandle.value) {
        case 'nw':
          newX = rectStart.value.x + dxPercent
          newY = rectStart.value.y + dyPercent
          newWidth = rectStart.value.width - dxPercent
          newHeight = rectStart.value.height - dyPercent
          break
        case 'ne':
          newY = rectStart.value.y + dyPercent
          newWidth = rectStart.value.width + dxPercent
          newHeight = rectStart.value.height - dyPercent
          break
        case 'sw':
          newX = rectStart.value.x + dxPercent
          newWidth = rectStart.value.width - dxPercent
          newHeight = rectStart.value.height + dyPercent
          break
        case 'se':
          newWidth = rectStart.value.width + dxPercent
          newHeight = rectStart.value.height + dyPercent
          break
      }

      // 应用比例约束（非自由模式下）
      if (cropMode.value !== 'free') {
        if (cropMode.value === '1:1') {
          const size = Math.max(newWidth, newHeight)
          if (resizeHandle.value.includes('w')) {
            newWidth = size
            newHeight = size
          } else {
            newWidth = size
            newHeight = size
          }
        } else if (cropMode.value === '4:3') {
          const ratio = 4 / 3
          if (resizeHandle.value === 'se') {
            if (newWidth / newHeight > ratio) {
              newHeight = newWidth / ratio
            } else {
              newWidth = newHeight * ratio
            }
          }
        } else if (cropMode.value === '16:9') {
          const ratio = 16 / 9
          if (resizeHandle.value === 'se') {
            if (newWidth / newHeight > ratio) {
              newHeight = newWidth / ratio
            } else {
              newWidth = newHeight * ratio
            }
          }
        }
      }

      // 最小尺寸限制
      const minSize = 10
      if (newWidth < minSize) {
        newWidth = minSize
        if (resizeHandle.value === 'nw' || resizeHandle.value === 'sw') {
          newX = rectStart.value.x + rectStart.value.width - minSize
        }
      }
      if (newHeight < minSize) {
        newHeight = minSize
        if (resizeHandle.value === 'nw' || resizeHandle.value === 'ne') {
          newY = rectStart.value.y + rectStart.value.height - minSize
        }
      }

      // 边界检查
      newX = Math.max(0, newX)
      newY = Math.max(0, newY)
      newWidth = Math.min(newWidth, 100 - newX)
      newHeight = Math.min(newHeight, 100 - newY)

      cropRect.value = { x: newX, y: newY, width: newWidth, height: newHeight }
      render()
    }
  }

  /**
   * 鼠标释放
   */
  function handleMouseUp() {
    isDragging.value = false
    isResizing.value = false
    resizeHandle.value = null
  }

  // ========== 编辑操作 ==========

  /**
   * 旋转 90 度
   */
  function rotate90() {
    rotation.value = (rotation.value + 90) % 360
    render()
  }

  /**
   * 旋转 -90 度
   */
  function rotateNeg90() {
    rotation.value = (rotation.value - 90 + 360) % 360
    render()
  }

  /**
   * 水平翻转
   */
  function toggleFlipH() {
    flipH.value = !flipH.value
    render()
  }

  /**
   * 垂直翻转
   */
  function toggleFlipV() {
    flipV.value = !flipV.value
    render()
  }

  /**
   * 设置裁剪模式
   */
  function setCropMode(mode) {
    if (cropMode.value === mode) {
      cropMode.value = null
    } else {
      cropMode.value = mode
      // 重置裁剪区域为中心
      cropRect.value = { x: 10, y: 10, width: 80, height: 80 }

      // 应用比例
      if (mode === '1:1') {
        cropRect.value.height = cropRect.value.width
      } else if (mode === '4:3') {
        cropRect.value.height = cropRect.value.width * (3 / 4)
      } else if (mode === '16:9') {
        cropRect.value.height = cropRect.value.width * (9 / 16)
      }
    }
    render()
  }

  /**
   * 设置滤镜
   */
  function setFilter(filterName) {
    selectedFilter.value = filterName
    if (filterName !== 'none') {
      // 重置手动调整
      brightness.value = 100
      contrast.value = 100
      saturation.value = 100
    }
    render()
  }

  /**
   * 设置亮度
   */
  function setBrightness(value) {
    brightness.value = value
    selectedFilter.value = 'none'
    render()
  }

  /**
   * 设置对比度
   */
  function setContrast(value) {
    contrast.value = value
    selectedFilter.value = 'none'
    render()
  }

  /**
   * 设置饱和度
   */
  function setSaturation(value) {
    saturation.value = value
    selectedFilter.value = 'none'
    render()
  }

  /**
   * 重置所有编辑
   */
  function resetEdits() {
    rotation.value = 0
    flipH.value = false
    flipV.value = false
    cropMode.value = null
    cropRect.value = { x: 10, y: 10, width: 80, height: 80 }
    brightness.value = 100
    contrast.value = 100
    saturation.value = 100
    selectedFilter.value = 'none'
    render()
  }

  // ========== 导出 ==========

  /**
   * 导出编辑后的图片
   */
  function exportImage(maxSize = 2000) {
    if (!originalImage.value) return null

    const img = originalImage.value
    let width = img.width
    let height = img.height

    // 应用旋转后的尺寸
    if (rotation.value % 180 !== 0) {
      ;[width, height] = [height, width]
    }

    // 限制最大尺寸
    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height)
      width *= ratio
      height *= ratio
    }

    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = width
    exportCanvas.height = height
    const exportCtx = exportCanvas.getContext('2d')

    exportCtx.save()

    // 应用滤镜
    const filter = filters[selectedFilter.value] || filters.none
    const finalBrightness = selectedFilter.value === 'none' ? brightness.value : filter.brightness
    const finalContrast = selectedFilter.value === 'none' ? contrast.value : filter.contrast
    const finalSaturation = selectedFilter.value === 'none' ? saturation.value : filter.saturation

    exportCtx.filter = `brightness(${finalBrightness}%) contrast(${finalContrast}%) saturate(${finalSaturation}%)`

    exportCtx.translate(width / 2, height / 2)
    exportCtx.rotate((rotation.value * Math.PI) / 180)
    exportCtx.scale(
      flipH.value ? -1 : 1,
      flipV.value ? -1 : 1
    )

    const drawWidth = rotation.value % 180 === 0 ? width : height
    const drawHeight = rotation.value % 180 === 0 ? height : width

    exportCtx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)

    exportCtx.restore()

    return {
      blob: exportCanvas.toBlob.bind(exportCanvas),
      dataUrl: exportCanvas.toDataURL('image/png'),
      width,
      height
    }
  }

  /**
   * 导出为 Blob
   */
  async function exportAsBlob() {
    const exporter = exportImage()
    if (!exporter) return null

    return new Promise((resolve) => {
      exporter.blob((blob) => {
        resolve(blob)
      }, 'image/png')
    })
  }

  /**
   * 导出为 DataURL
   */
  function exportAsDataUrl() {
    const exporter = exportImage()
    return exporter ? exporter.dataUrl : null
  }

  // ========== 计算属性 ==========

  const hasChanges = computed(() => {
    return rotation.value !== 0 ||
      flipH.value ||
      flipV.value ||
      brightness.value !== 100 ||
      contrast.value !== 100 ||
      saturation.value !== 100 ||
      selectedFilter.value !== 'none'
  })

  const currentFilterName = computed(() => {
    return filters[selectedFilter.value]?.name || '原图'
  })

  return {
    // 状态
    canvas,
    ctx,
    isReady,
    rotation,
    flipH,
    flipV,
    cropMode,
    cropRect,
    brightness,
    contrast,
    saturation,
    selectedFilter,
    filters,
    hasChanges,
    currentFilterName,

    // 方法
    initCanvas,
    loadImage,
    render,
    rotate90,
    rotateNeg90,
    toggleFlipH,
    toggleFlipV,
    setCropMode,
    setFilter,
    setBrightness,
    setContrast,
    setSaturation,
    resetEdits,
    exportImage,
    exportAsBlob,
    exportAsDataUrl
  }
}
