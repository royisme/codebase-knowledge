/**
 * Backend API types for authentication endpoints
 * These types match the OpenAPI schema from backend/docs/openapi.json
 */

/**
 * BearerResponse from POST /api/v1/auth/login
 */
export interface BearerResponseAPI {
  access_token: string
  token_type: string
}

/**
 * UserRead from backend - snake_case fields
 */
export interface UserReadAPI {
  id: string // UUID format
  email: string
  is_active: boolean
  is_superuser: boolean
  is_verified: boolean
  full_name: string | null
  company: string | null
  department: string | null
  role: string // Single role, not array
}

/**
 * UserCreate for POST /api/v1/auth/register
 */
export interface UserCreateAPI {
  email: string
  password: string
  is_active?: boolean | null
  is_superuser?: boolean | null
  is_verified?: boolean | null
  full_name?: string | null
  company?: string | null
  department?: string | null
  role?: string
}

/**
 * Login request body - form-urlencoded format
 */
export interface LoginRequestAPI {
  grant_type?: string | null
  username: string // email is sent as username
  password: string
  scope?: string
  client_id?: string | null
  client_secret?: string | null
}
