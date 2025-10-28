/**
 * Type converters between backend API types (snake_case) and frontend types (camelCase)
 */

import type { AuthUser, SessionToken, UserRole } from '../auth'
import type { UserReadAPI, BearerResponseAPI } from './auth'
import type { Identifier, ISODateString } from '../common'

/**
 * Convert backend role string to frontend UserRole array
 */
export function convertRoleToRoles(role: string): UserRole[] {
  // Map backend role to frontend role type
  const roleMap: Record<string, UserRole> = {
    'viewer': 'viewer',
    'maintainer': 'maintainer',
    'admin': 'admin',
    'superadmin': 'superadmin',
  }

  const mappedRole = roleMap[role] || 'viewer'
  return [mappedRole]
}

/**
 * Convert backend UserReadAPI to frontend AuthUser
 */
export function convertUserReadToAuthUser(userApi: UserReadAPI): AuthUser {
  const now = new Date().toISOString() as ISODateString

  return {
    id: userApi.id as Identifier,
    email: userApi.email,
    fullName: userApi.full_name || userApi.email.split('@')[0],
    company: userApi.company,
    department: userApi.department,
    roles: convertRoleToRoles(userApi.role),
    createdAt: now, // Backend doesn't provide these, use current time
    updatedAt: now,
    createdBy: 'system' as Identifier,
    updatedBy: 'system' as Identifier,
    lastLoginAt: now,
  }
}

/**
 * Convert BearerResponseAPI to SessionToken
 */
export function convertBearerResponseToSessionToken(
  bearer: BearerResponseAPI
): SessionToken {
  // Default to 1 hour expiry if not provided
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() as ISODateString

  return {
    accessToken: bearer.access_token,
    refreshToken: undefined, // Backend doesn't provide refresh token in login response
    expiresAt,
  }
}
