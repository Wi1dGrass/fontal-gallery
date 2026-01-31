/**
 * 搜索状态共享模块
 * 用于在页面之间传递搜索意图，而不污染 URL
 */

import { ref } from 'vue'

// 待执行的搜索标签
const pendingSearchTag = ref(null)

/**
 * 设置待搜索的标签
 * @param {string} tag - 标签名称
 */
export function setPendingSearchTag(tag) {
  pendingSearchTag.value = tag
}

/**
 * 获取并清空待搜索的标签
 * @returns {string|null} 标签名称或 null
 */
export function getPendingSearchTag() {
  const tag = pendingSearchTag.value
  pendingSearchTag.value = null
  return tag
}

/**
 * 暴露响应式引用（仅供监听使用）
 */
export { pendingSearchTag }
