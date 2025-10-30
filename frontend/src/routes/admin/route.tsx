import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { requireAdminRole } from '@/lib/rbac'
import { AdminLayout } from '@/components/layout/admin-layout'

export const Route = createFileRoute('/admin')({
  beforeLoad: () => {
    // 检查认证状态
    const authStore = useAuthStore.getState()
    if (!authStore.auth.isAuthenticated || !authStore.auth.user) {
      // 获取当前路径用于重定向
      const currentPath =
        typeof window !== 'undefined' ? window.location.pathname : '/sign-in'

      throw redirect({
        to: '/sign-in',
        search: { redirect: currentPath },
      })
    }

    // 检查管理员角色
    requireAdminRole()

    return { user: authStore.auth.user }
  },
  component: AdminLayout,
})
