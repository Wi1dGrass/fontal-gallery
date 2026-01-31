/**
 * image-core - 图片核心功能模块
 *
 * 提供图片懒加载、虚拟滚动、图片压缩等功能
 */

// 图片懒加载
export { useLazyImage, createLazyDirective } from './useLazyImage.js'

// 虚拟滚动
export { useVirtualScroll, useSimpleVirtualScroll } from './useVirtualScroll.js'

// 图片压缩
export { useImageCompressor, createImagePreview } from './useImageCompressor.js'
