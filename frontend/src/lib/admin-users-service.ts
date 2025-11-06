import type {
  AdminUser,
  AdminUserListParams,
  AdminUserListResponse,
  ResetPasswordPayload,
  UpdateUserStatusPayload,
  UpdateUserRolePayload,
  UserActivity,
  UserStatus,
} from '@/types'
import { apiClient } from './api-client'
import { API_ENDPOINTS } from './api-endpoints'

/**
 * 后端返回的用户数据格式
 */
interface BackendUser {
  id: string
  email: string
  is_active: boolean
  is_superuser: boolean
  is_verified: boolean
  full_name?: string
  company?: string
  department?: string
  role: string
}

/**
 * 后端返回的用户列表格式
 */
interface BackendUserListResponse {
  users: BackendUser[]
  total: number
  page: number
  limit: number
}

/**
 * 将后端用户状态转换为前端状态枚举
 */
function mapBackendStatusToFrontend(
  isActive: boolean,
  isVerified: boolean
): UserStatus {
  if (!isActive) return 'suspended'
  if (!isVerified) return 'unverified'
  return 'active'
}

/**
 * 将后端用户数据转换为前端格式
 */
function adaptBackendUser(backendUser: BackendUser): AdminUser {
  return {
    id: backendUser.id,
    email: backendUser.email,
    displayName: backendUser.full_name || backendUser.email,
    avatar: undefined, // 后端暂不提供头像
    status: mapBackendStatusToFrontend(
      backendUser.is_active,
      backendUser.is_verified
    ),
    roleIds: [backendUser.role], // 后端返回单个 role，转换为数组
    lastLoginAt: undefined, // 后端暂不提供最后登录时间
    createdAt: new Date().toISOString(), // 后端暂不提供创建时间
    updatedAt: new Date().toISOString(),
    createdBy: '',
    updatedBy: '',
  }
}

/**
 * 将后端用户列表响应转换为前端格式
 */
function adaptBackendUserList(
  backendResponse: BackendUserListResponse
): AdminUserListResponse {
  return {
    items: backendResponse.users.map(adaptBackendUser),
    total: backendResponse.total,
    page: backendResponse.page,
    pageSize: backendResponse.limit,
  }
}

/**
 * 构建用户列表查询参数
 */
function buildUserQueryParams(params?: AdminUserListParams): string {
  const searchParams = new URLSearchParams()

  if (!params) return ''

  // 后端使用 page 和 limit，前端使用 page 和 pageSize
  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('limit', String(params.pageSize))

  // 搜索参数（如果后端支持）
  if (params.search && params.search.trim().length > 0) {
    searchParams.set('search', params.search.trim())
  }

  // 状态筛选（需要后端支持）
  params.statuses?.forEach((status) => {
    searchParams.append('status', status)
  })

  // 角色筛选（需要后端支持）
  params.roleIds?.forEach((roleId) => {
    searchParams.append('role', roleId)
  })

  const query = searchParams.toString()
  return query.length > 0 ? `?${query}` : ''
}

/**
 * 获取用户列表
 */
export async function listAdminUsers(
  params?: AdminUserListParams
): Promise<AdminUserListResponse> {
  const query = buildUserQueryParams(params)
  const backendResponse = await apiClient<BackendUserListResponse>({
    endpoint: `${API_ENDPOINTS.users.list}${query}`,
  })

  return adaptBackendUserList(backendResponse)
}

/**
 * 更新用户角色
 */
export function updateUserRole(payload: UpdateUserRolePayload) {
  return apiClient<BackendUser>({
    endpoint: API_ENDPOINTS.users.update(payload.userId),
    method: 'PATCH',
    body: { role: payload.roleIds[0] }, // 后端只支持单个角色
  }).then(adaptBackendUser)
}

/**
 * 重置用户密码
 */
export function resetUserPassword(payload: ResetPasswordPayload) {
  return apiClient<{ temporaryPassword: string }>({
    endpoint: `${API_ENDPOINTS.users.detail(payload.userId)}/reset-password`,
    method: 'POST',
    body: { temporaryPassword: payload.temporaryPassword },
  })
}

/**
 * 更新用户状态
 */
export function updateUserStatus(payload: UpdateUserStatusPayload) {
  // 将前端状态转换为后端字段
  const backendPayload: Partial<{
    is_active: boolean
    is_verified: boolean
  }> = {}

  switch (payload.status) {
    case 'active':
      backendPayload.is_active = true
      backendPayload.is_verified = true
      break
    case 'suspended':
      backendPayload.is_active = false
      break
    case 'unverified':
      backendPayload.is_active = true
      backendPayload.is_verified = false
      break
  }

  return apiClient<BackendUser>({
    endpoint: API_ENDPOINTS.users.update(payload.userId),
    method: 'PATCH',
    body: backendPayload,
  }).then(adaptBackendUser)
}

/**
 * 获取用户活动记录
 */
export function getUserActivity(userId: string) {
  return apiClient<UserActivity[]>({
    endpoint: `${API_ENDPOINTS.users.detail(userId)}/activity`,
  })
}
