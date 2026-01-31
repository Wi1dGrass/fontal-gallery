/**
 * useLazyImage - 图片懒加载 Composable
 *
 * 使用 IntersectionObserver API 实现高性能图片懒加载
 *
 * @param {Object} options - 配置选项
 * @param {string} options.placeholder - 占位图 URL
 * @param {string} options.rootMargin - 预加载距离，默认 '100px'
 * @param {number} options.threshold - 触发阈值，默认 0.01
 * @returns {Object} { loadImage, isLoading, observe, unobserve }
 */
import { ref, onUnmounted } from 'vue'

export function useLazyImage(options = {}) {
  const {
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%231a1a1a" width="400" height="300"/%3E%3C/svg%3E',
    rootMargin = '200px',
    threshold = 0.01
  } = options

  // 创建 IntersectionObserver 实例
  let observer = null

  // 已加载的图片集合 (避免重复加载)
  const loadedImages = new WeakSet()

  // 待处理的图片元素队列
  const pendingElements = new Map()

  /**
   * 初始化 Observer
   */
  function initObserver() {
    if (observer) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 图片进入视口，开始加载
          if (entry.isIntersecting) {
            const img = entry.target
            loadImage(img)

            // 加载后停止观察
            observer.unobserve(img)
            pendingElements.delete(img)
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )
  }

  /**
   * 加载图片
   * @param {HTMLImageElement} img - 图片元素
   */
  function loadImage(img) {
    // 避免重复加载
    if (loadedImages.has(img)) return

    const src = img.dataset.src
    if (!src) return

    // 创建临时图片预加载
    const tempImg = new Image()

    tempImg.onload = () => {
      img.src = src
      img.classList.add('lazy-loaded')
      img.classList.remove('lazy-loading')
      loadedImages.add(img)
    }

    tempImg.onerror = () => {
      img.classList.add('lazy-error')
      img.classList.remove('lazy-loading')
    }

    img.classList.add('lazy-loading')
    tempImg.src = src
  }

  /**
   * 观察图片元素
   * @param {HTMLImageElement} img - 图片元素
   */
  function observe(img) {
    if (!img) return

    // 设置占位图
    if (placeholder && !img.src) {
      img.src = placeholder
    }

    // 如果已经在视口内，直接加载
    if (isInViewport(img)) {
      loadImage(img)
      return
    }

    // 否则加入观察队列
    initObserver()
    observer.observe(img)
    pendingElements.set(img, true)
  }

  /**
   * 停止观察图片元素
   * @param {HTMLImageElement} img - 图片元素
   */
  function unobserve(img) {
    if (!img || !observer) return
    observer.unobserve(img)
    pendingElements.delete(img)
  }

  /**
   * 检查元素是否在视口内
   * @param {HTMLElement} element - DOM 元素
   * @returns {boolean}
   */
  function isInViewport(element) {
    const rect = element.getBoundingClientRect()
    const windowHeight = window.innerHeight || document.documentElement.clientHeight
    const windowWidth = window.innerWidth || document.documentElement.clientWidth

    // 解析 rootMargin
    const margin = parseRootMargin(rootMargin)
    const top = -margin.top
    const bottom = windowHeight + margin.bottom
    const left = -margin.left
    const right = windowWidth + margin.right

    return (
      rect.top >= top &&
      rect.left >= left &&
      rect.bottom <= bottom &&
      rect.right <= right
    )
  }

  /**
   * 解析 rootMargin
   * @param {string} margin - '100px' 或 '10px 20px' 等
   * @returns {Object} { top, right, bottom, left }
   */
  function parseRootMargin(margin) {
    const parts = margin.split(/\s+/)
    const values = parts.map(p => parseInt(p) || 0)

    switch (values.length) {
      case 1:
        return { top: values[0], right: values[0], bottom: values[0], left: values[0] }
      case 2:
        return { top: values[0], right: values[1], bottom: values[0], left: values[1] }
      case 3:
        return { top: values[0], right: values[1], bottom: values[2], left: values[1] }
      case 4:
        return { top: values[0], right: values[1], bottom: values[2], left: values[3] }
      default:
        return { top: 0, right: 0, bottom: 0, left: 0 }
    }
  }

  /**
   * 批量观察多个图片元素
   * @param {HTMLCollection|NodeList|Array} images - 图片元素集合
   */
  function observeAll(images) {
    if (!images) return
    Array.from(images).forEach(img => observe(img))
  }

  /**
   * 清理资源
   */
  function cleanup() {
    if (observer) {
      observer.disconnect()
      observer = null
    }
    pendingElements.clear()
  }

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup()
  })

  return {
    loadImage,
    observe,
    unobserve,
    observeAll,
    cleanup,
    isInViewport
  }
}

/**
 * 用于 v-lazy 指令的版本
 * @param {Object} options - 配置选项
 * @returns {Object} 指令对象
 */
export function createLazyDirective(options = {}) {
  const { observe, unobserve, cleanup } = useLazyImage(options)

  return {
    mounted(el, binding) {
      el.dataset.src = binding.value
      observe(el)
    },
    updated(el, binding) {
      if (binding.value !== binding.oldValue) {
        el.dataset.src = binding.value
        if (!el.classList.contains('lazy-loaded')) {
          observe(el)
        }
      }
    },
    unmounted(el) {
      unobserve(el)
    }
  }
}
