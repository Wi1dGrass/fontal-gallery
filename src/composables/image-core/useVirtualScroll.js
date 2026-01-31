/**
 * useVirtualScroll - 虚拟滚动 Composable
 *
 * 大数据量时只渲染可视区域的图片，提升性能
 *
 * @param {Object} options - 配置选项
 * @param {Array} options.items - 所有数据项
 * @param {number} options.itemHeight - 单项高度（网格模式时为行高）
 * @param {number} options.containerHeight - 容器高度
 * @param {number} options.bufferSize - 缓冲区数量（上下各渲染多少项）
 * @param {number} options.columns - 列数（网格布局时）
 * @returns {Object} 虚拟滚动相关状态和方法
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export function useVirtualScroll(options = {}) {
  const {
    items = ref([]),
    itemHeight = 300, // 默认每项高度
    containerHeight = 800, // 默认容器高度
    bufferSize = 2, // 上下各渲染几行缓冲
    columns = 4 // 默认列数
  } = options

  // 容器 ref
  const containerRef = ref(null)

  // 滚动位置
  const scrollTop = ref(0)

  // 容器实际高度
  const actualContainerHeight = ref(containerHeight)

  // 计算属性：总行数
  const totalRows = computed(() => {
    return Math.ceil(items.value.length / columns)
  })

  // 计算属性：总内容高度
  const totalHeight = computed(() => {
    return totalRows.value * itemHeight
  })

  // 计算属性：可见行数
  const visibleRows = computed(() => {
    return Math.ceil(actualContainerHeight.value / itemHeight)
  })

  // 计算属性：起始行索引
  const startIndex = computed(() => {
    const startRow = Math.floor(scrollTop.value / itemHeight)
    return Math.max(0, (startRow - bufferSize) * columns)
  })

  // 计算属性：结束行索引
  const endIndex = computed(() => {
    const endRow = Math.min(
      totalRows.value,
      Math.ceil((scrollTop.value + actualContainerHeight.value) / itemHeight) + bufferSize
    )
    return Math.min(items.value.length, endRow * columns)
  })

  // 计算属性：可见数据
  const visibleItems = computed(() => {
    return items.value.slice(startIndex.value, endIndex.value)
  })

  // 计算属性：偏移量（用于定位）
  const offsetY = computed(() => {
    const startRow = Math.floor(startIndex.value / columns)
    return startRow * itemHeight
  })

  // 计算属性：是否需要虚拟滚动（数据量足够大时才启用）
  const shouldVirtualize = computed(() => {
    return items.value.length > columns * (visibleRows.value + bufferSize * 2)
  })

  /**
   * 处理滚动事件
   */
  function handleScroll(event) {
    scrollTop.value = event.target.scrollTop
  }

  /**
   * 滚动到指定索引
   * @param {number} index - 项目索引
   */
  function scrollToIndex(index) {
    if (!containerRef.value) return

    const row = Math.floor(index / columns)
    const targetScrollTop = row * itemHeight

    containerRef.value.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    })
  }

  /**
   * 滚动到顶部
   */
  function scrollToTop() {
    if (!containerRef.value) return
    containerRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /**
   * 滚动到底部
   */
  function scrollToBottom() {
    if (!containerRef.value) return
    containerRef.value.scrollTo({
      top: totalHeight.value,
      behavior: 'smooth'
    })
  }

  /**
   * 更新容器尺寸
   */
  function updateContainerSize() {
    if (containerRef.value) {
      actualContainerHeight.value = containerRef.value.clientHeight
    }
  }

  /**
   * 重置滚动位置
   */
  function resetScroll() {
    scrollTop.value = 0
    if (containerRef.value) {
      containerRef.value.scrollTop = 0
    }
  }

  // 监听窗口大小变化
  const handleResize = () => {
    updateContainerSize()
  }

  onMounted(() => {
    updateContainerSize()
    window.addEventListener('resize', handleResize)

    // 监听容器滚动事件
    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', handleScroll)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', handleScroll)
    }
  })

  // 监听 items 变化，重置滚动
  watch(items, () => {
    resetScroll()
  })

  return {
    // Refs
    containerRef,
    scrollTop,
    actualContainerHeight,

    // Computed
    totalRows,
    totalHeight,
    visibleRows,
    startIndex,
    endIndex,
    visibleItems,
    offsetY,
    shouldVirtualize,

    // Methods
    handleScroll,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    updateContainerSize,
    resetScroll
  }
}

/**
 * 简化版虚拟滚动 - 用于固定高度的列表
 *
 * @param {Object} options - 配置选项
 * @returns {Object} 虚拟滚动相关状态和方法
 */
export function useSimpleVirtualScroll(options = {}) {
  const {
    items = ref([]),
    itemHeight = 100,
    containerHeight = 600,
    overscan = 3 // 额外渲染的项数
  } = options

  const scrollTop = ref(0)
  const containerRef = ref(null)

  const totalHeight = computed(() => items.value.length * itemHeight)

  const startIndex = computed(() => {
    return Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan)
  })

  const endIndex = computed(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    return Math.min(
      items.value.length,
      Math.floor(scrollTop.value / itemHeight) + visibleCount + overscan
    )
  })

  const visibleItems = computed(() => {
    return items.value.slice(startIndex.value, endIndex.value)
  })

  const offsetY = computed(() => {
    return startIndex.value * itemHeight
  })

  function handleScroll(e) {
    scrollTop.value = e.target.scrollTop
  }

  return {
    containerRef,
    scrollTop,
    totalHeight,
    startIndex,
    endIndex,
    visibleItems,
    offsetY,
    handleScroll
  }
}
