/**
 * API 配置
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8123/api'

/**
 * GitHub OAuth 配置
 */
export const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || ''
export const GITHUB_REDIRECT_URI = window.location.origin + '/auth'

/**
 * 构建 GitHub OAuth URL
 */
export function getGitHubAuthUrl() {
  return `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&scope=user:email`
}

/**
 * 安全解析 JSON 响应（后端已处理 ID 字符串化，前端直接使用即可）
 * 保留此函数以防需要统一处理响应格式或错误
 */
async function safeResponseJson(response) {
  // 后端已将 ID 字段序列化为字符串，直接解析即可
  return await response.json()
}

/**
 * 通用的安全请求函数
 */
async function safeRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    ...options
  })

  // 先检查 HTTP 状态
  if (!response.ok) {
    const errorData = await safeResponseJson(response).catch(() => ({}))
    throw new Error(errorData.message || `HTTP ${response.status}`)
  }

  return safeResponseJson(response)
}

// ========== 图片 API ==========

/**
 * 上传图片（文件）
 */
export async function uploadPicture(file, options = {}) {
  const formData = new FormData()
  formData.append('file', file)

  // 添加可选参数
  if (options.id) formData.append('id', options.id)
  if (options.fileUrl) formData.append('fileUrl', options.fileUrl)

  return safeRequest(`${API_BASE_URL}/picture/upload`, {
    method: 'POST',
    body: formData
  })
}

/**
 * 上传图片（URL）
 */
export async function uploadPictureByUrl(fileUrl, options = {}) {
  return safeRequest(`${API_BASE_URL}/picture/upload/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileUrl, ...options })
  })
}

/**
 * 获取图片详情
 */
export async function getPictureById(id) {
  return safeRequest(`${API_BASE_URL}/picture/get/vo?id=${id}`)
}

/**
 * 分页获取图片列表
 */
export async function getPictureListPage(query = {}) {
  return safeRequest(`${API_BASE_URL}/picture/list/page/vo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  })
}

/**
 * 删除图片
 */
export async function deletePicture(id) {
  return safeRequest(`${API_BASE_URL}/picture/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  })
}

/**
 * 更新图片
 */
export async function updatePicture(data) {
  return safeRequest(`${API_BASE_URL}/picture/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

/**
 * 批量抓取图片（从其他网站）
 */
export async function fetchPicturesByBatch(params = {}) {
  return safeRequest(`${API_BASE_URL}/picture/fetch/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })
}

/**
 * 获取图片数据库统计信息
 */
export async function getPicDatabaseInfo() {
  return safeRequest(`${API_BASE_URL}/picture/get/number`)
}

/**
 * 审核图片
 */
export async function doPictureReview(data) {
  return safeRequest(`${API_BASE_URL}/picture/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}
