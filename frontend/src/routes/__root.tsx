import { type QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/navigation-progress'
import { GeneralError } from '@/features/errors/general-error'
import { NotFoundError } from '@/features/errors/not-found-error'
import { useAuthStore } from '@/stores/auth-store'
import { fetchCurrentUser } from '@/lib/auth-service'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  beforeLoad: async () => {
    const authStore = useAuthStore.getState()

    // 如果有token但没有用户信息，尝试恢复用户信息
    if (authStore.auth.token && !authStore.auth.user) {
      try {
        const user = await fetchCurrentUser()
        authStore.auth.setUser(user)
      } catch (error) {
        // 如果获取用户信息失败（比如token过期），清除认证状态
        // eslint-disable-next-line no-console
        console.warn('Failed to restore user session:', error)
        authStore.auth.clear()
      }
    }
  },
  component: () => {
    return (
      <>
        <NavigationProgress />
        <Outlet />
        <Toaster duration={5000} />
        {import.meta.env.MODE === 'development' && (
          <>
            <ReactQueryDevtools buttonPosition='bottom-left' />
            <TanStackRouterDevtools position='bottom-right' />
          </>
        )}
      </>
    )
  },
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})
