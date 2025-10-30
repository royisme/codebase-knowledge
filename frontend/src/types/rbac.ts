import type { AuditMetadata, Identifier, ISODateString } from './common'

export type PolicyEffect = 'allow' | 'deny'

export type ResourceIdentifier = 'knowledge_sources' | 'users' | 'policies'

export type ActionVerb = 'read' | 'admin'

export interface RoleDefinition extends AuditMetadata {
  id: Identifier
  name: string
  description: string
  inheritedRoles: Identifier[]
}

export interface PolicyRule extends AuditMetadata {
  id: Identifier
  roleId: Identifier
  resource: ResourceIdentifier
  actions: ActionVerb[]
  effect: PolicyEffect
}

export interface RoleAssignment extends AuditMetadata {
  id: Identifier
  userId: Identifier
  roleId: Identifier
  assignedBy: Identifier
  expiresAt?: ISODateString
}

export interface RbacAuditLog {
  id: Identifier
  actor: string
  action: AuditAction
  target: string
  status: 'success' | 'failure'
  timestamp: ISODateString
  details?: string
}

export type AuditAction =
  | 'assign_role'
  | 'update_policy'
  | 'create_policy'
  | 'delete_policy'
  | 'login_attempt'
  | 'permission_denied'
