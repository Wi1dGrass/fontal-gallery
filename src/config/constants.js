/**
 * 业务常量配置
 */
export const LIMITS = {
  /** 头像最大大小 (5MB) */
  MAX_AVATAR_SIZE: 5 * 1024 * 1024,
  /** 密码最小长度 */
  MIN_PASSWORD_LENGTH: 8,
  /** 用户名最大长度 */
  MAX_USERNAME_LENGTH: 20,
  /** 个人简介最大长度 */
  MAX_PROFILE_LENGTH: 512
}

/**
 * 认证缓存时间 (5分钟)
 */
export const AUTH_CACHE_DURATION = 5 * 60 * 1000

/**
 * Toast 默认显示时间 (3秒)
 */
export const TOAST_DURATION = 3000
