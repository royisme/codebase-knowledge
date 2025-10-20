import { beforeEach, describe, expect, it } from 'vitest'

import {
  requestPasswordReset,
  signIn,
  signUp,
  verifyOtp,
} from '@/lib/auth-service'
import { useAuthStore } from '@/stores/auth-store'
import { authFixtures } from '@/lib/api-mock/fixtures/auth'

describe('Auth mock flows', () => {
  beforeEach(() => {
    useAuthStore.getState().auth.reset()
  })

  it('signs in with valid credentials', async () => {
    const response = await signIn(authFixtures.credentials)
    expect(response.user.email).toBe(authFixtures.credentials.email)
    expect(response.token.accessToken).toBeTruthy()
  })

  it('fails sign in with invalid password', async () => {
    await expect(
      signIn({
        email: authFixtures.credentials.email,
        password: 'wrong-password',
      })
    ).rejects.toMatchObject({ status: 401 })
  })

  it('registers a new account', async () => {
    const email = `new-user-${Date.now()}@example.com`
    const response = await signUp({
      email,
      displayName: 'New User',
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
    })
    expect(response.user.email).toBe(email)
  })

  it('verifies otp after requesting password reset', async () => {
    await requestPasswordReset({ email: authFixtures.credentials.email })
    const response = await verifyOtp({
      email: authFixtures.credentials.email,
      otp: authFixtures.validOtp,
    })
    expect(response.user.email).toBe(authFixtures.credentials.email)
  })
})
