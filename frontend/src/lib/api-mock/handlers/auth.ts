import type {
  ForgotPasswordPayload,
  OtpVerificationPayload,
  SignUpPayload,
} from '@/types'
import type { BearerResponseAPI, UserReadAPI } from '@/types/api'
import { HttpResponse, http } from 'msw'
import { authFixtures } from '../fixtures/auth'

function extractBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null
  const [scheme, token] = headerValue.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

export const authHandlers = [
  // POST /api/v1/auth/login - Returns BearerResponse
  http.post('*/api/v1/auth/login', async ({ request }) => {
    // Parse form-urlencoded data
    const formData = await request.formData()
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    if (!username || !password) {
      return HttpResponse.json(
        {
          detail: 'LOGIN_BAD_CREDENTIALS',
        },
        { status: 400 }
      )
    }

    // Check credentials
    const credential = authFixtures.findCredentials(username)
    if (
      !credential ||
      credential.password !== password ||
      authFixtures.shouldSimulateLoginFailure?.()
    ) {
      return HttpResponse.json(
        {
          detail: 'LOGIN_BAD_CREDENTIALS',
        },
        { status: 400 }
      )
    }

    // Return BearerResponse format (backend format)
    // Pass the authenticated user to associate token correctly
    const bearerResponse: BearerResponseAPI = authFixtures.createBearerResponse(
      credential.user
    )
    return HttpResponse.json(bearerResponse)
  }),

  // GET /api/v1/admin/users/me - Returns UserRead
  http.get('*/api/v1/admin/users/me', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return HttpResponse.json({ detail: 'UNAUTHORIZED' }, { status: 401 })
    }

    const user = authFixtures.findUserByToken(token)
    if (!user) {
      return HttpResponse.json({ detail: 'UNAUTHORIZED' }, { status: 401 })
    }

    // Return backend format (snake_case)
    const userReadAPI: UserReadAPI = authFixtures.convertToUserReadAPI(user)
    return HttpResponse.json(userReadAPI)
  }),

  // POST /api/v1/auth/register - Returns UserRead
  http.post('*/api/v1/auth/register', async ({ request }) => {
    // Handle backend field names (full_name, company, department)
    const payload = (await request.json()) as {
      email: string
      password: string
      full_name: string
      company?: string | null
      department?: string | null
    }

    // Map backend fields to frontend types
    const signUpPayload: SignUpPayload = {
      email: payload.email,
      password: payload.password,
      confirmPassword: payload.password, // Backend doesn't need confirmPassword
      fullName: payload.full_name,
      company: payload.company || '',
      department: payload.department || '',
    }

    // Basic validation
    if (
      !signUpPayload?.email ||
      !signUpPayload?.password ||
      !signUpPayload?.fullName
    ) {
      return HttpResponse.json(
        {
          detail: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(signUpPayload.email)) {
      return HttpResponse.json(
        {
          detail: 'INVALID_EMAIL',
        },
        { status: 400 }
      )
    }

    // Password length validation (backend requires at least 3 chars per OpenAPI)
    if (signUpPayload.password.length < 3) {
      return HttpResponse.json(
        {
          detail: {
            code: 'REGISTER_INVALID_PASSWORD',
            reason: 'Password should be at least 3 characters',
          },
        },
        { status: 400 }
      )
    }

    try {
      const userRead = authFixtures.registerUser(signUpPayload)
      // Return backend format (snake_case)
      const userReadAPI: UserReadAPI = {
        id: userRead.id,
        email: userRead.email,
        is_active: true,
        is_superuser: false,
        is_verified: false,
        full_name: userRead.fullName,
        company: userRead.company || null,
        department: userRead.department || null,
        role: userRead.roles[0] || 'viewer',
      }
      return HttpResponse.json(userReadAPI, { status: 201 })
    } catch (error) {
      if (error instanceof Error && error.message === 'USER_EXISTS') {
        return HttpResponse.json(
          {
            detail: 'REGISTER_USER_ALREADY_EXISTS',
          },
          { status: 400 }
        )
      }
      return HttpResponse.json(
        {
          detail: 'UNKNOWN_ERROR',
        },
        { status: 500 }
      )
    }
  }),

  // POST /api/v1/auth/forgot-password
  http.post('*/api/v1/auth/forgot-password', async ({ request }) => {
    const payload = (await request.json()) as Partial<ForgotPasswordPayload>
    if (!payload?.email) {
      return HttpResponse.json(
        {
          detail: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }
    authFixtures.requestPasswordReset(payload.email)
    return HttpResponse.json({}, { status: 202 })
  }),

  // POST /api/v1/auth/otp/verify (might not exist in backend)
  http.post('*/api/v1/auth/otp/verify', async ({ request }) => {
    const payload = (await request.json()) as Partial<OtpVerificationPayload>
    if (!payload?.email || !payload?.otp) {
      return HttpResponse.json(
        {
          detail: 'VALIDATION_ERROR',
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
              detail: 'OTP_INVALID',
            },
            { status: 400 }
          )
        }
        if (error.message === 'USER_NOT_FOUND') {
          return HttpResponse.json(
            {
              detail: 'USER_NOT_FOUND',
            },
            { status: 404 }
          )
        }
      }
      return HttpResponse.json(
        {
          detail: 'UNKNOWN_ERROR',
        },
        { status: 500 }
      )
    }
  }),

  // POST /api/v1/auth/logout
  http.post('*/api/v1/auth/logout', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (token) {
      authFixtures.revokeToken(token)
    }
    return HttpResponse.json({}, { status: 200 })
  }),
]
