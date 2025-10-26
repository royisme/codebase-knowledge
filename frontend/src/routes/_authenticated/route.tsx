import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    // 检查认证状态
    const authStore = useAuthStore.getState()
    if (!authStore.auth.isAuthenticated || !authStore.auth.user) {
      // 获取当前路径用于重定向
      const currentPath = typeof window !== 'undefined'
        ? window.location.pathname
        : '/sign-in'

      throw redirect({
        to: '/sign-in',
        search: { redirect: currentPath }
      })
    }

    return { user: authStore.auth.user }
  },
  component: AuthenticatedLayout,
})
