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
    ).rejects.toMatchObject({ status: 400 })
  })

  it('registers a new account', async () => {
    const email = `new-user-${Date.now()}@example.com`
    const response = await signUp({
      email,
      fullName: 'New User',
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
      company: 'Test Company',
      department: 'Test Department',
    })
    expect(response.email).toBe(email)
    expect(response.fullName).toBe('New User')
    expect(response.company).toBe('Test Company')
    expect(response.department).toBe('Test Department')
    expect(response.roles).toContain('viewer')
  })

  it('verifies otp after requesting password reset', async () => {
    await requestPasswordReset({ email: authFixtures.credentials.email })
    const response = await verifyOtp({
      email: authFixtures.credentials.email,
      otp: authFixtures.validOtp,
    })
    expect(response.user.email).toBe(authFixtures.credentials.email)
  })

  it('handles two-step registration flow successfully', async () => {
    const email = `test-user-${Date.now()}@example.com`
    const password = 'Passw0rd!'
    const fullName = 'Test User'
    const company = 'Test Company'
    const department = 'Test Department'

    // Step 1: Register user (should return UserRead without tokens)
    const user = await signUp({
      email,
      password,
      confirmPassword: password,
      fullName,
      company,
      department,
    })

    expect(user.email).toBe(email)
    expect(user.fullName).toBe(fullName)
    expect(user.company).toBe(company)
    expect(user.department).toBe(department)
    expect(user).not.toHaveProperty('token')

    // Step 2: Login with the same credentials
    const authResponse = await signIn({
      email,
      password,
    })

    expect(authResponse.user.email).toBe(email)
    expect(authResponse.token.accessToken).toBeTruthy()
    expect(authResponse.token.expiresAt).toBeTruthy()
  })

  it('handles registration with empty company and department', async () => {
    const email = `minimal-user-${Date.now()}@example.com`
    const response = await signUp({
      email,
      fullName: 'Minimal User',
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
      company: '',
      department: '',
    })

    expect(response.email).toBe(email)
    expect(response.company).toBe(null)
    expect(response.department).toBe(null)
  })

  it('handles registration with optional company and department omitted', async () => {
    const email = `optional-user-${Date.now()}@example.com`
    const response = await signUp({
      email,
      fullName: 'Optional User',
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
    })

    expect(response.email).toBe(email)
    expect(response.company).toBe(null)
    expect(response.department).toBe(null)
  })

  it('handles registration with only company provided', async () => {
    const email = `company-only-${Date.now()}@example.com`
    const response = await signUp({
      email,
      fullName: 'Company Only User',
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
      company: 'Company Only Inc',
      department: '',
    })

    expect(response.email).toBe(email)
    expect(response.company).toBe('Company Only Inc')
    expect(response.department).toBe(null)
  })

  it('handles registration with only department provided', async () => {
    const email = `dept-only-${Date.now()}@example.com`
    const response = await signUp({
      email,
      fullName: 'Department Only User',
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
      company: '',
      department: 'Engineering',
    })

    expect(response.email).toBe(email)
    expect(response.company).toBe(null)
    expect(response.department).toBe('Engineering')
  })

  it('fails registration with invalid email format', async () => {
    await expect(
      signUp({
        email: 'invalid-email',
        fullName: 'Test User',
        password: 'Passw0rd!',
        confirmPassword: 'Passw0rd!',
        company: 'Test Company',
        department: 'Test Department',
      })
    ).rejects.toMatchObject({ status: 400 })
  })

  
  it('fails registration with short password', async () => {
    await expect(
      signUp({
        email: 'test@example.com',
        fullName: 'Test User',
        password: '12', // Less than 3 characters (backend requirement)
        confirmPassword: '12',
        company: 'Test Company',
        department: 'Test Department',
      })
    ).rejects.toMatchObject({ status: 400 })
  })

  it('handles login failure after successful registration', async () => {
    const email = `login-fail-test-${Date.now()}@example.com`
    const password = 'Passw0rd!'

    // Register successfully
    await signUp({
      email,
      fullName: 'Login Fail Test User',
      password,
      confirmPassword: password,
      company: 'Test Company',
      department: 'Test Department',
    })

    // Try to login with wrong password (should fail)
    await expect(
      signIn({
        email,
        password: 'WrongPassword!',
      })
    ).rejects.toMatchObject({ status: 400 })
  })
})
