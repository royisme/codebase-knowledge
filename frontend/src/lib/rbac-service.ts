import { apiClient } from './api-client'
import { API_ENDPOINTS } from './api-endpoints'

/**
 * 权限动作映射：前端友好名称 <-> 后端 HTTP 方法
 */
export const ACTION_MAPPING = {
  // 前端 -> 后端
  toBackend: {
    read: 'GET',
    admin: '*', // 管理权限表示所有方法
  },
  // 后端 -> 前端
  toFrontend: (action: string): string => {
    const upper = action.toUpperCase()
    // Casbin normalize_action_pattern 会把 '*' 变成 '.*'
    if (upper === '*' || upper === '.*') return 'admin'
    // 处理以 '|' 分隔的复合动作（如 GET|POST）
    const parts = upper.split('|').filter(Boolean)
    if (parts.length > 1) {
      // 全是 GET 视为只读，否则视为管理
      return parts.every((p) => p === 'GET') ? 'read' : 'admin'
    }
    if (upper === 'GET') return 'read'
    // 对于其他 HTTP 方法（POST、PUT、DELETE、PATCH），视为管理权限
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(upper)) return 'admin'
    return action.toLowerCase() // 兜底，保持原值
  },
} as const

export type ActionType = 'read' | 'admin'

export interface RbacRole {
  name: string
  description: string
  permissions: string[]
}

export interface RbacPolicy {
  id: number
  subject: string
  resource: string
  action: string
}

export interface AuditLogEntry {
  id: string
  actor: string
  action: string
  target: string
  status: 'success' | 'failure'
  timestamp: string
  details?: string | null
}

export async function fetchRoles(): Promise<RbacRole[]> {
  return apiClient<RbacRole[]>({ endpoint: API_ENDPOINTS.rbac.roles })
}

export async function fetchPolicies(): Promise<RbacPolicy[]> {
  const policies = await apiClient<RbacPolicy[]>({
    endpoint: API_ENDPOINTS.rbac.policies,
  })
  // 将后端的 HTTP 方法转换为前端友好名称
  return policies.map((p) => ({
    ...p,
    action: ACTION_MAPPING.toFrontend(p.action),
  }))
}

export async function updatePolicyAction(policyId: number, action: ActionType) {
  // 将前端友好名称转换为后端 HTTP 方法
  const backendAction = ACTION_MAPPING.toBackend[action]
  const result = await apiClient<RbacPolicy>({
    endpoint: API_ENDPOINTS.rbac.policyDetail(policyId),
    method: 'PATCH',
    body: { action: backendAction },
  })
  // 返回时转换回前端格式
  return {
    ...result,
    action: ACTION_MAPPING.toFrontend(result.action),
  }
}

export async function deletePolicy(policyId: number) {
  await apiClient<void>({
    endpoint: API_ENDPOINTS.rbac.policyDetail(policyId),
    method: 'DELETE',
  })
}

export async function createPolicy(payload: {
  subject: string
  resource: string
  action: ActionType
}) {
  // 将前端友好名称转换为后端 HTTP 方法
  const backendAction = ACTION_MAPPING.toBackend[payload.action]
  const result = await apiClient<RbacPolicy>({
    endpoint: API_ENDPOINTS.rbac.policies,
    method: 'POST',
    body: {
      ...payload,
      action: backendAction,
    },
  })
  // 返回时转换回前端格式
  return {
    ...result,
    action: ACTION_MAPPING.toFrontend(result.action),
  }
}

export async function fetchAuditLogs(): Promise<{
  audits: AuditLogEntry[]
  total: number
  page: number
  limit: number
}> {
  return apiClient<{
    audits: AuditLogEntry[]
    total: number
    page: number
    limit: number
  }>({
    endpoint: API_ENDPOINTS.audit.list,
  })
}
