import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/(auth)')({
  beforeLoad: () => {
    // 如果用户已登陆，重定向到首页
    const authStore = useAuthStore.getState()
    if (authStore.auth.isAuthenticated && authStore.auth.user) {
      throw redirect({
        to: '/',
      })
    }
  },
  component: Outlet,
})
