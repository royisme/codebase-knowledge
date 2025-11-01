import type {
  ActionVerb,
  Identifier,
  PolicyRule,
  ResourceIdentifier,
  RbacAuditLog,
  RoleAssignment,
  RoleDefinition,
} from '@/types'
import { apiClient } from './api-client'
import { API_ENDPOINTS } from './api-endpoints'

export interface ListRolesResponse {
  roles: RoleDefinition[]
}

export interface ListPoliciesResponse {
  policies: PolicyRule[]
  resources: Record<ResourceIdentifier, ActionVerb[]>
}

export interface ListAuditsResponse {
  audits: RbacAuditLog[]
}

export interface ListRoleMembersResponse {
  members: Array<RoleAssignment & { email: string; displayName: string }>
}

export async function fetchRoles(): Promise<RoleDefinition[]> {
  const data = await apiClient<ListRolesResponse>({
    endpoint: API_ENDPOINTS.rbac.roles,
  })
  return data.roles
}

export async function fetchPolicies(): Promise<ListPoliciesResponse> {
  return apiClient<ListPoliciesResponse>({ endpoint: API_ENDPOINTS.rbac.permissions })
}

export async function fetchAuditLogs(): Promise<RbacAuditLog[]> {
  const data = await apiClient<ListAuditsResponse>({
    endpoint: API_ENDPOINTS.audit.list,
  })
  return data.audits
}

export async function fetchRoleMembers(): Promise<
  ListRoleMembersResponse['members']
> {
  const data = await apiClient<ListRoleMembersResponse>({
    endpoint: API_ENDPOINTS.rbac.roleMembers,
  })
  return data.members
}

export async function assignRole(payload: {
  userId: Identifier
  roleId: Identifier
}): Promise<RoleAssignment & { email: string; displayName: string }> {
  const data = await apiClient<{
    assignment: RoleAssignment & { email: string; displayName: string }
  }>({
    endpoint: API_ENDPOINTS.rbac.assignRole,
    method: 'POST',
    body: payload,
  })
  return data.assignment
}

export async function updatePolicy(payload: {
  roleId: Identifier
  resource: ResourceIdentifier
  actions: ActionVerb[]
}): Promise<PolicyRule> {
  const data = await apiClient<{ policy: PolicyRule }>({
    endpoint: API_ENDPOINTS.rbac.updatePolicy,
    method: 'POST',
    body: payload,
  })
  return data.policy
}
