import { redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import type { UserRole } from '@/types'

/**
 * 检查当前用户是否拥有指定角色中的任意一个
 * @param allowedRoles 允许的角色列表
 * @returns 如果用户拥有指定角色返回 true，否则返回 false
 */
export function hasRole(allowedRoles: UserRole[]): boolean {
  const { user } = useAuthStore.getState().auth
  if (!user || !user.roles || user.roles.length === 0) {
    return false
  }
  return user.roles.some((role) => allowedRoles.includes(role))
}

/**
 * 快速判断当前用户是否为管理员（admin 或 superadmin）
 * @returns 如果是管理员返回 true，否则返回 false
 */
export function isAdmin(): boolean {
  return hasRole(['admin', 'superadmin'])
}

/**
 * 路由守卫：要求当前用户必须是管理员
 * 如果不是管理员，则重定向到首页
 * 在路由的 beforeLoad 中调用
 */
export function requireAdminRole(): void {
  if (!isAdmin()) {
    throw redirect({
      to: '/',
      replace: true,
    })
  }
}
