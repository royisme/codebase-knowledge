import type {
  AdminUser,
  AdminUserListParams,
  AdminUserListResponse,
  ResetPasswordPayload,
  UpdateUserStatusPayload,
  UpdateUserRolePayload,
  UserActivity,
} from '@/types'
import { apiClient } from './api-client'

function buildUserQueryParams(params?: AdminUserListParams) {
  const searchParams = new URLSearchParams()

  if (!params) return ''

  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
  if (params.search && params.search.trim().length > 0) {
    searchParams.set('search', params.search.trim())
  }
  params.statuses?.forEach((status) => {
    searchParams.append('statuses', status)
  })
  params.roleIds?.forEach((roleId) => {
    searchParams.append('roleId', roleId)
  })

  const query = searchParams.toString()
  return query.length > 0 ? `?${query}` : ''
}

export function listAdminUsers(params?: AdminUserListParams) {
  const query = buildUserQueryParams(params)
  return apiClient<AdminUserListResponse>({
    endpoint: `/api/admin/users${query}`,
  })
}

export function updateUserRole(payload: UpdateUserRolePayload) {
  return apiClient<AdminUser>({
    endpoint: `/api/admin/users/${payload.userId}/roles`,
    method: 'PATCH',
    body: { roleIds: payload.roleIds },
  })
}

export function resetUserPassword(payload: ResetPasswordPayload) {
  return apiClient<{ temporaryPassword: string }>({
    endpoint: `/api/admin/users/${payload.userId}/reset-password`,
    method: 'POST',
    body: { temporaryPassword: payload.temporaryPassword },
  })
}

export function updateUserStatus(payload: UpdateUserStatusPayload) {
  return apiClient<AdminUser>({
    endpoint: `/api/admin/users/${payload.userId}/status`,
    method: 'PATCH',
    body: { status: payload.status },
  })
}

export function getUserActivity(userId: string) {
  return apiClient<UserActivity[]>({
    endpoint: `/api/admin/users/${userId}/activity`,
  })
}
