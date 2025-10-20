import type {
  AuthResponse,
  AuthUser,
  ForgotPasswordPayload,
  OtpVerificationPayload,
  SignInPayload,
  SignUpPayload,
} from '@/types'

import { apiClient } from './api-client'

export async function signIn(payload: SignInPayload): Promise<AuthResponse> {
  return apiClient<AuthResponse>({
    endpoint: '/api/auth/login',
    method: 'POST',
    body: payload,
  })
}

export async function signUp(payload: SignUpPayload): Promise<AuthResponse> {
  return apiClient<AuthResponse>({
    endpoint: '/api/auth/register',
    method: 'POST',
    body: payload,
  })
}

export async function requestPasswordReset(
  payload: ForgotPasswordPayload
): Promise<void> {
  await apiClient<void>({
    endpoint: '/api/auth/forgot-password',
    method: 'POST',
    body: payload,
  })
}

export async function verifyOtp(
  payload: OtpVerificationPayload
): Promise<AuthResponse> {
  return apiClient<AuthResponse>({
    endpoint: '/api/auth/otp/verify',
    method: 'POST',
    body: payload,
  })
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  return apiClient<AuthUser>({
    endpoint: '/api/auth/me',
    method: 'GET',
  })
}

export async function logout(): Promise<void> {
  await apiClient<void>({
    endpoint: '/api/auth/logout',
    method: 'POST',
  })
}
