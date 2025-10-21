import type { Identifier, ISODateString } from './common'

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'invited'

export interface AdminUser {
  id: Identifier
  email: string
  displayName: string
  avatar?: string
  status: UserStatus
  roleIds: Identifier[]
  lastLoginAt?: ISODateString
  createdAt: ISODateString
  updatedAt: ISODateString
  createdBy: Identifier
  updatedBy: Identifier
}

export interface AdminUserListParams {
  page?: number
  pageSize?: number
  search?: string
  statuses?: UserStatus[]
  roleIds?: Identifier[]
}

export interface AdminUserListResponse {
  items: AdminUser[]
  total: number
  page: number
  pageSize: number
}

export interface UpdateUserRolePayload {
  userId: Identifier
  roleIds: Identifier[]
}

export interface ResetPasswordPayload {
  userId: Identifier
  temporaryPassword?: string
}

export interface UpdateUserStatusPayload {
  userId: Identifier
  status: UserStatus
}

export interface UserActivity {
  id: Identifier
  userId: Identifier
  action: string
  description: string
  timestamp: ISODateString
  ipAddress?: string
  userAgent?: string
}
