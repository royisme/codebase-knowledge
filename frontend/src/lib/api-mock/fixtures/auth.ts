import type {
  AuthResponse,
  AuthUser,
  Identifier,
  SessionToken,
  SignInPayload,
  SignUpPayload,
  UserRole,
} from '@/types'

const mockRoles: UserRole[] = ['admin']

const mockUser: AuthUser = {
  id: 'user-1' as Identifier,
  email: 'admin@example.com',
  displayName: 'Admin User',
  roles: mockRoles,
  createdAt: new Date('2025-01-01T08:00:00Z').toISOString() as AuthUser['createdAt'],
  updatedAt: new Date('2025-01-10T08:00:00Z').toISOString() as AuthUser['updatedAt'],
  createdBy: 'system' as Identifier,
  updatedBy: 'system' as Identifier,
  lastLoginAt: new Date('2025-01-18T12:00:00Z').toISOString() as AuthUser['lastLoginAt'],
}

const MOCK_PASSWORD = 'Passw0rd!'
const VALID_OTP_CODE = '123456'

function createSessionToken(): SessionToken {
  return {
    accessToken: `mock-access-token-${crypto.randomUUID?.() ?? Date.now()}`,
    refreshToken: 'mock-refresh-token',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() as SessionToken['expiresAt'],
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

function createUserFromSignUp(payload: SignUpPayload): AuthUser {
  return {
    id: `user-${crypto.randomUUID?.() ?? Date.now()}` as Identifier,
    email: payload.email,
    displayName: payload.displayName ?? payload.email.split('@')[0],
    roles: ['viewer'],
    createdAt: new Date().toISOString() as AuthUser['createdAt'],
    updatedAt: new Date().toISOString() as AuthUser['updatedAt'],
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
  findCredentials(email: string): CredentialEntry | undefined {
    return credentialStore.get(email.toLowerCase())
  },
  findUserByToken(token: string): AuthUser | undefined {
    return tokenStore.get(token)
  },
  registerUser(payload: SignUpPayload): AuthResponse {
    const existing = credentialStore.get(payload.email.toLowerCase())
    if (existing) {
      throw new Error('USER_EXISTS')
    }
    const newUser = createUserFromSignUp(payload)
    credentialStore.set(payload.email.toLowerCase(), {
      user: newUser,
      password: payload.password,
    })
    return authFixtures.createAuthResponse(newUser)
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
    if (otp !== VALID_OTP_CODE || !pendingOtpEmail || pendingOtpEmail !== email) {
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
