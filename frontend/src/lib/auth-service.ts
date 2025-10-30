import type {
  AuthResponse,
  AuthUser,
  ForgotPasswordPayload,
  OtpVerificationPayload,
  SignInPayload,
  SignUpPayload,
  UserRead,
} from '@/types'
import {
  type BearerResponseAPI,
  type UserReadAPI,
  convertBearerResponseToSessionToken,
  convertUserReadToAuthUser,
} from '@/types/api'
import { apiClient } from './api-client'

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim()
const BASE_URL =
  RAW_BASE_URL && RAW_BASE_URL.length > 0
    ? RAW_BASE_URL
    : 'http://localhost:8000'

export async function signIn(payload: SignInPayload): Promise<AuthResponse> {
  // Step 1: Login to get access token (form-urlencoded)
  const formData = new URLSearchParams()
  formData.append('username', payload.email)
  formData.append('password', payload.password)

  const loginUrl = new URL('/api/v1/auth/login', BASE_URL).toString()
  const loginResponse = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
    credentials: 'include',
  })

  if (!loginResponse.ok) {
    const error = await loginResponse.json().catch(() => ({}))
    throw {
      status: loginResponse.status,
      code: error.detail || 'LOGIN_FAILED',
      message:
        error.detail === 'LOGIN_BAD_CREDENTIALS'
          ? '邮箱或密码错误'
          : '登录失败',
    }
  }

  const bearerResponse: BearerResponseAPI = await loginResponse.json()
  const sessionToken = convertBearerResponseToSessionToken(bearerResponse)

  // Step 2: Get current user info using the access token
  const userUrl = new URL('/api/v1/admin/users/me', BASE_URL).toString()
  const userResponse = await fetch(userUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${sessionToken.accessToken}`,
    },
    credentials: 'include',
  })

  if (!userResponse.ok) {
    throw {
      status: userResponse.status,
      code: 'USER_INFO_FAILED',
      message: '获取用户信息失败',
    }
  }

  const userReadAPI: UserReadAPI = await userResponse.json()
  const user = convertUserReadToAuthUser(userReadAPI)

  return {
    user,
    token: sessionToken,
  }
}

export async function signUp(payload: SignUpPayload): Promise<UserRead> {
  // Map frontend fields to backend field names according to OpenAPI UserCreate schema
  const backendPayload: {
    email: string
    password: string
    full_name?: string | null
    company?: string | null
    department?: string | null
  } = {
    email: payload.email,
    password: payload.password,
    full_name: payload.fullName || null,
    company: payload.company || null,
    department: payload.department || null,
  }

  const response = await apiClient<UserReadAPI>({
    endpoint: '/api/v1/auth/register',
    method: 'POST',
    body: backendPayload,
  })

  // Convert snake_case UserReadAPI to camelCase UserRead for frontend
  return {
    id: response.id,
    email: response.email,
    fullName: response.full_name || response.email.split('@')[0],
    company: response.company,
    department: response.department,
    roles: [response.role as UserRead['roles'][number]],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    updatedBy: 'system',
  } as UserRead
}

export async function requestPasswordReset(
  payload: ForgotPasswordPayload
): Promise<void> {
  await apiClient<void>({
    endpoint: '/api/v1/auth/forgot-password',
    method: 'POST',
    body: payload,
  })
}

export async function verifyOtp(
  payload: OtpVerificationPayload
): Promise<AuthResponse> {
  // Note: This endpoint might not exist in the backend OpenAPI spec
  // Keeping the implementation for now, but it may need adjustment
  return apiClient<AuthResponse>({
    endpoint: '/api/v1/auth/otp/verify',
    method: 'POST',
    body: payload,
  })
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await apiClient<UserReadAPI>({
    endpoint: '/api/v1/admin/users/me',
    method: 'GET',
  })

  return convertUserReadToAuthUser(response)
}

export async function logout(): Promise<void> {
  await apiClient<void>({
    endpoint: '/api/v1/auth/logout',
    method: 'POST',
  })
}
