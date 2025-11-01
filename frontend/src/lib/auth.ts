/**
 * 认证工具函数
 */
import { useAuthStore } from '@/stores/auth-store'

/**
 * 获取当前用户的访问令牌
 *
 * @returns 访问令牌字符串，如果未登录则返回空字符串
 */
export function getAuthToken(): string {
  const token = useAuthStore.getState().auth.token?.accessToken
  return token || ''
}

/**
 * 检查用户是否已登录
 *
 * @returns 如果用户已登录返回 true，否则返回 false
 */
export function isAuthenticated(): boolean {
  return !!useAuthStore.getState().auth.token?.accessToken
}

/**
 * 获取当前登录用户信息
 *
 * @returns 用户对象，如果未登录则返回 null
 */
export function getCurrentUser() {
  return useAuthStore.getState().auth.user
}

/**
 * 清除认证信息（用于登出）
 */
export function clearAuth(): void {
  useAuthStore.getState().auth.clear()
}
