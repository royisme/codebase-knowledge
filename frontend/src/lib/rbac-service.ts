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
  const data = await apiClient<ListRolesResponse>({ endpoint: '/api/admin/roles' })
  return data.roles
}

export async function fetchPolicies(): Promise<ListPoliciesResponse> {
  return apiClient<ListPoliciesResponse>({ endpoint: '/api/admin/policies' })
}

export async function fetchAuditLogs(): Promise<RbacAuditLog[]> {
  const data = await apiClient<ListAuditsResponse>({ endpoint: '/api/admin/audit' })
  return data.audits
}

export async function fetchRoleMembers(): Promise<ListRoleMembersResponse['members']> {
  const data = await apiClient<ListRoleMembersResponse>({
    endpoint: '/api/admin/role-members',
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
    endpoint: '/api/admin/role-members/assign',
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
    endpoint: '/api/admin/policies/update',
    method: 'POST',
    body: payload,
  })
  return data.policy
}
