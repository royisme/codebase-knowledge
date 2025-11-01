import { authFixtures } from './api-mock/fixtures/auth'
import { useAuthStore } from '@/stores/auth-store'

/**
 * 设置测试环境的认证状态
 */
export function setupTestAuth() {
  const authResponse = authFixtures.createAuthResponse(authFixtures.user)
  useAuthStore.getState().auth.setAuth(authResponse)
  return authResponse
}

/**
 * 清除测试环境的认证状态
 */
export function clearTestAuth() {
  useAuthStore.getState().auth.clear()
}
