import { HttpResponse, http } from 'msw'

import type {
  ForgotPasswordPayload,
  OtpVerificationPayload,
  SignInPayload,
  SignUpPayload,
} from '@/types'

import { authFixtures } from '../fixtures/auth'

function extractBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null
  const [scheme, token] = headerValue.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

export const authHandlers = [
  http.post('*/auth/login', async ({ request }) => {
    const payload = (await request.json()) as Partial<SignInPayload>
    if (!payload?.email || !payload?.password) {
      return HttpResponse.json(
        {
          code: 'INVALID_CREDENTIALS',
          message: '邮箱或密码为必填项',
        },
        { status: 400 }
      )
    }

    const credential = authFixtures.findCredentials(payload.email)
    if (!credential || credential.password !== payload.password) {
      return HttpResponse.json(
        {
          code: 'INVALID_CREDENTIALS',
          message: '邮箱或密码错误',
        },
        { status: 401 }
      )
    }

    return HttpResponse.json(authFixtures.createAuthResponse(credential.user))
  }),

  http.post('*/auth/register', async ({ request }) => {
    const payload = (await request.json()) as Partial<SignUpPayload>
    if (!payload?.email || !payload?.password || !payload?.confirmPassword) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: '请填写完整的注册信息',
        },
        { status: 400 }
      )
    }

    if (payload.password !== payload.confirmPassword) {
      return HttpResponse.json(
        {
          code: 'PASSWORD_MISMATCH',
          message: '两次输入的密码不一致',
        },
        { status: 400 }
      )
    }

    try {
      const response = authFixtures.registerUser({
        email: payload.email,
        password: payload.password,
        confirmPassword: payload.confirmPassword,
        displayName: payload.displayName ?? payload.email,
      })
      return HttpResponse.json(response, { status: 201 })
    } catch (error) {
      if (error instanceof Error && error.message === 'USER_EXISTS') {
        return HttpResponse.json(
          {
            code: 'USER_EXISTS',
            message: '该邮箱已注册，请直接登录',
          },
          { status: 409 }
        )
      }
      return HttpResponse.json(
        {
          code: 'UNKNOWN_ERROR',
          message: '注册失败，请稍后再试',
        },
        { status: 500 }
      )
    }
  }),

  http.post('*/auth/forgot-password', async ({ request }) => {
    const payload = (await request.json()) as Partial<ForgotPasswordPayload>
    if (!payload?.email) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: '请输入邮箱地址',
        },
        { status: 400 }
      )
    }
    authFixtures.requestPasswordReset(payload.email)
    return HttpResponse.json({ sent: true })
  }),

  http.post('*/auth/otp/verify', async ({ request }) => {
    const payload = (await request.json()) as Partial<OtpVerificationPayload>
    if (!payload?.email || !payload?.otp) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: '请输入邮箱与验证码',
        },
        { status: 400 }
      )
    }
    try {
      const response = authFixtures.verifyOtp(payload.email, payload.otp)
      return HttpResponse.json(response)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'OTP_INVALID') {
          return HttpResponse.json(
            {
              code: 'OTP_INVALID',
              message: '验证码无效或已过期',
            },
            { status: 400 }
          )
        }
        if (error.message === 'USER_NOT_FOUND') {
          return HttpResponse.json(
            {
              code: 'USER_NOT_FOUND',
              message: '账号不存在，请重新注册',
            },
            { status: 404 }
          )
        }
      }
      return HttpResponse.json(
        {
          code: 'UNKNOWN_ERROR',
          message: '验证码验证失败',
        },
        { status: 500 }
      )
    }
  }),

  http.post('*/auth/logout', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (token) {
      authFixtures.revokeToken(token)
    }
    return HttpResponse.json(null, { status: 204 })
  }),

  http.get('*/auth/me', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: '未授权访问' },
        { status: 401 }
      )
    }
    const user = authFixtures.findUserByToken(token)
    if (!user) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: '会话已过期' },
        { status: 401 }
      )
    }
    return HttpResponse.json(user)
  }),
]
