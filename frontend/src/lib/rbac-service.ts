import { apiClient } from './api-client'
import { API_ENDPOINTS } from './api-endpoints'

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
  return apiClient<RbacPolicy[]>({ endpoint: API_ENDPOINTS.rbac.policies })
}

export async function updatePolicyAction(policyId: number, action: string) {
  return apiClient<RbacPolicy>({
    endpoint: API_ENDPOINTS.rbac.policyDetail(policyId),
    method: 'PATCH',
    body: { action },
  })
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
  action: string
}) {
  return apiClient<RbacPolicy>({
    endpoint: API_ENDPOINTS.rbac.policies,
    method: 'POST',
    body: payload,
  })
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
