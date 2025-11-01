import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { authFixtures } from '@/lib/api-mock/fixtures/auth'
import { apiClient } from '@/lib/api-client'

describe('Dashboard API with Auth', () => {
  beforeEach(() => {
    useAuthStore.getState().auth.reset()
    
    // 设置认证
    const authResp = authFixtures.createAuthResponse(authFixtures.user)
    useAuthStore.getState().auth.setAuth({
      user: authFixtures.user,
      token: authResp.token,
    })
  })

  it('should fetch dashboard summary with auth', async () => {
    const result = await apiClient({
      endpoint: '/api/v1/dashboard/summary',
    })
    
    expect(result).toBeDefined()
  })
})
