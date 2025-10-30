import type {
  AuthResponse,
  AuthUser,
  UserRead,
  Identifier,
  SessionToken,
  SignInPayload,
  SignUpPayload,
  UserRole,
} from '@/types'
import type { BearerResponseAPI, UserReadAPI } from '@/types/api'

const mockRoles: UserRole[] = ['admin']

const mockUser: AuthUser = {
  id: 'user-1' as Identifier,
  email: 'admin@example.com',
  fullName: 'Admin User',
  company: 'CIT Corporation',
  department: '技术部',
  roles: mockRoles,
  createdAt: new Date(
    '2025-01-01T08:00:00Z'
  ).toISOString() as AuthUser['createdAt'],
  updatedAt: new Date(
    '2025-01-10T08:00:00Z'
  ).toISOString() as AuthUser['updatedAt'],
  createdBy: 'system' as Identifier,
  updatedBy: 'system' as Identifier,
  lastLoginAt: new Date(
    '2025-01-18T12:00:00Z'
  ).toISOString() as AuthUser['lastLoginAt'],
}

const MOCK_PASSWORD = 'Passw0rd!'
const VALID_OTP_CODE = '123456'

function createSessionToken(): SessionToken {
  return {
    accessToken: `mock-access-token-${crypto.randomUUID?.() ?? Date.now()}`,
    refreshToken: 'mock-refresh-token',
    expiresAt: new Date(
      Date.now() + 60 * 60 * 1000
    ).toISOString() as SessionToken['expiresAt'],
  }
}

function createUserSnapshot(): AuthUser {
  return {
    ...mockUser,
    lastLoginAt: new Date().toISOString() as AuthUser['lastLoginAt'],
  }
}

type CredentialEntry = {
  user: AuthUser
  password: string
}

const credentialStore = new Map<string, CredentialEntry>([
  [mockUser.email, { user: mockUser, password: MOCK_PASSWORD }],
])

const tokenStore = new Map<string, AuthUser>()

let pendingOtpEmail: string | null = null
let simulateLoginFailureAfterRegistration = false

function createUserFromSignUp(payload: SignUpPayload): UserRead {
  return {
    id: `user-${crypto.randomUUID?.() ?? Date.now()}` as Identifier,
    email: payload.email,
    fullName: payload.fullName ?? payload.email.split('@')[0],
    company: payload.company || null,
    department: payload.department || null,
    roles: ['viewer'],
    createdAt: new Date().toISOString() as UserRead['createdAt'],
    updatedAt: new Date().toISOString() as UserRead['updatedAt'],
    createdBy: 'system' as Identifier,
    updatedBy: 'system' as Identifier,
  }
}

export const authFixtures = {
  user: mockUser,
  credentials: {
    email: mockUser.email,
    password: MOCK_PASSWORD,
  } satisfies SignInPayload,
  validOtp: VALID_OTP_CODE,
  createUserSnapshot,
  createAuthResponse(user: AuthUser): AuthResponse {
    const session = createSessionToken()
    const enrichedUser: AuthUser = {
      ...user,
      updatedAt: new Date().toISOString() as AuthUser['updatedAt'],
      lastLoginAt: new Date().toISOString() as AuthUser['lastLoginAt'],
    }
    tokenStore.set(session.accessToken, enrichedUser)
    return {
      user: enrichedUser,
      token: session,
    }
  },
  // New: Create BearerResponse (backend login format)
  createBearerResponse(user: AuthUser): BearerResponseAPI {
    const session = createSessionToken()
    // Store the token for later /users/me lookup
    tokenStore.set(session.accessToken, user)
    return {
      access_token: session.accessToken,
      token_type: 'bearer',
    }
  },
  // New: Convert AuthUser to UserReadAPI (backend format)
  convertToUserReadAPI(user: AuthUser): UserReadAPI {
    return {
      id: user.id,
      email: user.email,
      is_active: true,
      is_superuser: user.roles.includes('superadmin'),
      is_verified: true,
      full_name: user.fullName,
      company: user.company || null,
      department: user.department || null,
      role: user.roles[0] || 'viewer',
    }
  },
  // Test utility for simulating login failure after registration
  setLoginFailureMode(enabled: boolean) {
    simulateLoginFailureAfterRegistration = enabled
  },
  shouldSimulateLoginFailure() {
    return simulateLoginFailureAfterRegistration
  },
  findCredentials(email: string): CredentialEntry | undefined {
    return credentialStore.get(email.toLowerCase())
  },
  findUserByToken(token: string): AuthUser | undefined {
    return tokenStore.get(token)
  },
  registerUser(payload: SignUpPayload): UserRead {
    const existing = credentialStore.get(payload.email.toLowerCase())
    if (existing) {
      throw new Error('USER_EXISTS')
    }
    const newUser = createUserFromSignUp(payload)

    // Convert UserRead to AuthUser for credential storage
    const authUser: AuthUser = {
      ...newUser,
      lastLoginAt: new Date().toISOString() as AuthUser['lastLoginAt'],
    }

    credentialStore.set(payload.email.toLowerCase(), {
      user: authUser,
      password: payload.password,
    })
    return newUser
  },
  requestPasswordReset(email: string): void {
    const account = credentialStore.get(email.toLowerCase())
    if (account) {
      pendingOtpEmail = account.user.email
    } else {
      pendingOtpEmail = email
    }
  },
  verifyOtp(email: string, otp: string): AuthResponse {
    if (
      otp !== VALID_OTP_CODE ||
      !pendingOtpEmail ||
      pendingOtpEmail !== email
    ) {
      throw new Error('OTP_INVALID')
    }
    const record = credentialStore.get(email.toLowerCase())
    pendingOtpEmail = null
    if (!record) {
      throw new Error('USER_NOT_FOUND')
    }
    return authFixtures.createAuthResponse(record.user)
  },
  revokeToken(token: string): void {
    tokenStore.delete(token)
  },
}
