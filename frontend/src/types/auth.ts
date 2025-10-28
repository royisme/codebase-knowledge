import type { AuditMetadata, Identifier, ISODateString } from './common'

export type UserRole =
  | 'superadmin'
  | 'admin'
  | 'maintainer'
  | 'viewer'

export interface AuthUser extends AuditMetadata {
  id: Identifier
  email: string
  fullName: string
  company?: string | null
  department?: string | null
  roles: UserRole[]
  lastLoginAt?: ISODateString
}

export type UserRead = Omit<AuthUser, 'lastLoginAt'>

export interface SessionToken {
  accessToken: string
  refreshToken?: string
  expiresAt: ISODateString
}

export interface AuthResponse {
  user: AuthUser
  token: SessionToken
}

export interface SignInPayload {
  email: string
  password: string
}

export interface SignUpPayload {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  company?: string
  department?: string
}

export interface OtpVerificationPayload {
  email: string
  otp: string
}

export interface ForgotPasswordPayload {
  email: string
}
