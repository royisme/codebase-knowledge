import type {
  ActionVerb,
  Identifier,
  ISODateString,
  PolicyRule,
  ResourceIdentifier,
  RbacAuditLog,
  RoleAssignment,
  RoleDefinition,
} from '@/types'

const ALLOWED_ACTIONS: ActionVerb[] = ['read', 'admin']

const RESOURCE_ACTIONS: Record<ResourceIdentifier, ActionVerb[]> = {
  knowledge_sources: [...ALLOWED_ACTIONS],
  users: [...ALLOWED_ACTIONS],
  policies: [...ALLOWED_ACTIONS],
}

const roles: RoleDefinition[] = [
  {
    id: 'role-admin' as Identifier,
    name: 'Administrator',
    description: '可管理知识源及用户权限',
    inheritedRoles: [],
    createdAt: new Date('2025-01-01T00:00:00Z').toISOString() as RoleDefinition['createdAt'],
    updatedAt: new Date('2025-01-10T00:00:00Z').toISOString() as RoleDefinition['updatedAt'],
    createdBy: 'user-1' as Identifier,
    updatedBy: 'user-1' as Identifier,
  },
  {
    id: 'role-viewer' as Identifier,
    name: 'Viewer',
    description: '仅能查看知识源与检索结果',
    inheritedRoles: [],
    createdAt: new Date('2025-01-05T00:00:00Z').toISOString() as RoleDefinition['createdAt'],
    updatedAt: new Date('2025-01-10T00:00:00Z').toISOString() as RoleDefinition['updatedAt'],
    createdBy: 'user-1' as Identifier,
    updatedBy: 'user-1' as Identifier,
  },
]

let policies: PolicyRule[] = [
  {
    id: 'policy-admin-knowledge' as Identifier,
    roleId: 'role-admin' as Identifier,
    resource: 'knowledge_sources',
    actions: [...ALLOWED_ACTIONS],
    effect: 'allow',
    createdAt: new Date('2025-01-02T00:00:00Z').toISOString() as PolicyRule['createdAt'],
    updatedAt: new Date('2025-01-15T00:00:00Z').toISOString() as PolicyRule['updatedAt'],
    createdBy: 'user-1' as Identifier,
    updatedBy: 'user-1' as Identifier,
  },
  {
    id: 'policy-admin-policies' as Identifier,
    roleId: 'role-admin' as Identifier,
    resource: 'policies',
    actions: [...ALLOWED_ACTIONS],
    effect: 'allow',
    createdAt: new Date('2025-01-02T00:00:00Z').toISOString() as PolicyRule['createdAt'],
    updatedAt: new Date('2025-01-15T00:00:00Z').toISOString() as PolicyRule['updatedAt'],
    createdBy: 'user-1' as Identifier,
    updatedBy: 'user-1' as Identifier,
  },
  {
    id: 'policy-admin-users' as Identifier,
    roleId: 'role-admin' as Identifier,
    resource: 'users',
    actions: [...ALLOWED_ACTIONS],
    effect: 'allow',
    createdAt: new Date('2025-01-02T00:00:00Z').toISOString() as PolicyRule['createdAt'],
    updatedAt: new Date('2025-01-15T00:00:00Z').toISOString() as PolicyRule['updatedAt'],
    createdBy: 'user-1' as Identifier,
    updatedBy: 'user-1' as Identifier,
  },
  {
    id: 'policy-viewer-knowledge' as Identifier,
    roleId: 'role-viewer' as Identifier,
    resource: 'knowledge_sources',
    actions: ['read'],
    effect: 'allow',
    createdAt: new Date('2025-01-06T00:00:00Z').toISOString() as PolicyRule['createdAt'],
    updatedAt: new Date('2025-01-16T00:00:00Z').toISOString() as PolicyRule['updatedAt'],
    createdBy: 'user-1' as Identifier,
    updatedBy: 'user-1' as Identifier,
  },
]

const audits: RbacAuditLog[] = [
  {
    id: 'audit-1' as Identifier,
    actor: 'admin@example.com',
    action: 'assign_role',
    target: '张三 -> Administrator',
    status: 'success',
    timestamp: new Date('2025-01-20T08:12:00Z').toISOString() as RbacAuditLog['timestamp'],
    details: '角色分配成功',
  },
  {
    id: 'audit-2' as Identifier,
    actor: 'admin@example.com',
    action: 'update_policy',
    target: 'Administrator / knowledge_sources',
    status: 'success',
    timestamp: new Date('2025-01-20T09:15:00Z').toISOString() as RbacAuditLog['timestamp'],
    details: '权限设置: read, admin',
  },
  {
    id: 'audit-3' as Identifier,
    actor: 'admin@example.com',
    action: 'create_policy',
    target: '新策略 -> Viewer',
    status: 'success',
    timestamp: new Date('2025-01-20T10:30:00Z').toISOString() as RbacAuditLog['timestamp'],
    details: '创建新的访问策略',
  },
  {
    id: 'audit-4' as Identifier,
    actor: 'viewer@example.com',
    action: 'login_attempt',
    target: '系统登录',
    status: 'success',
    timestamp: new Date('2025-01-20T11:45:00Z').toISOString() as RbacAuditLog['timestamp'],
    details: '用户登录成功',
  },
  {
    id: 'audit-5' as Identifier,
    actor: 'unknown@example.com',
    action: 'permission_denied',
    target: '/admin/users',
    status: 'failure',
    timestamp: new Date('2025-01-20T12:00:00Z').toISOString() as RbacAuditLog['timestamp'],
    details: '权限不足，访问被拒绝',
  },
]

type DirectoryUser = {
  id: Identifier
  email: string
  displayName: string
}

const directory: DirectoryUser[] = [
  {
    id: 'user-1' as Identifier,
    email: 'admin@example.com',
    displayName: '系统管理员',
  },
  {
    id: 'user-2' as Identifier,
    email: 'viewer@example.com',
    displayName: '知识查看者',
  },
]

let roleAssignments: RoleAssignment[] = [
  {
    id: 'assign-1' as Identifier,
    userId: 'user-1' as Identifier,
    roleId: 'role-admin' as Identifier,
    assignedBy: 'user-1' as Identifier,
    createdBy: 'user-1' as Identifier,
    updatedBy: 'user-1' as Identifier,
    createdAt: new Date('2025-01-01T00:00:00Z').toISOString() as ISODateString,
    updatedAt: new Date('2025-01-01T00:00:00Z').toISOString() as ISODateString,
  },
  {
    id: 'assign-2' as Identifier,
    userId: 'user-2' as Identifier,
    roleId: 'role-viewer' as Identifier,
    assignedBy: 'user-1' as Identifier,
    createdBy: 'user-1' as Identifier,
    updatedBy: 'user-1' as Identifier,
    createdAt: new Date('2025-01-05T00:00:00Z').toISOString() as ISODateString,
    updatedAt: new Date('2025-01-05T00:00:00Z').toISOString() as ISODateString,
  },
]

const sanitizeActions = (actions: ActionVerb[], resource: ResourceIdentifier): ActionVerb[] => {
  const allowed = new Set(RESOURCE_ACTIONS[resource] ?? [])
  return actions.filter((action) => allowed.has(action))
}

const resolveUser = (userId: Identifier): DirectoryUser | undefined =>
  directory.find((user) => user.id === userId)

export const rbacFixtures = {
  getRoles(): RoleDefinition[] {
    return roles.map((role) => ({ ...role }))
  },
  getPolicies(): PolicyRule[] {
    return policies.map((policy) => ({ ...policy }))
  },
  getAudits(): RbacAuditLog[] {
    return audits.map((audit) => ({ ...audit }))
  },
  getRoleMembers(): Array<RoleAssignment & { email: string; displayName: string }> {
    return roleAssignments.map((assignment) => {
      const user = resolveUser(assignment.userId)
      return {
        ...assignment,
        email: user?.email ?? 'unknown@example.com',
        displayName: user?.displayName ?? '未知用户',
      }
    })
  },
  assignRole(input: { userId: Identifier; roleId: Identifier; actorId?: Identifier }) {
    const user = resolveUser(input.userId)
    if (!user) {
      throw new Error('USER_NOT_FOUND')
    }
    if (!roles.find((role) => role.id === input.roleId)) {
      throw new Error('ROLE_NOT_FOUND')
    }

    const now = new Date().toISOString() as ISODateString
    const index = roleAssignments.findIndex((assignment) => assignment.userId === input.userId)
    const actor = input.actorId ?? ('user-1' as Identifier)
    const previous = index === -1 ? undefined : roleAssignments[index]
    const assignment: RoleAssignment = {
      id: `assign-${input.userId}` as Identifier,
      userId: input.userId,
      roleId: input.roleId,
      assignedBy: actor,
      createdBy: previous?.createdBy ?? actor,
      updatedBy: actor,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    }

    if (index === -1) {
      roleAssignments = [...roleAssignments, assignment]
    } else {
      roleAssignments = roleAssignments.map((current, i) => (i === index ? assignment : current))
    }

    audits.unshift({
      id: `audit-${crypto.randomUUID?.() ?? Date.now()}` as Identifier,
      actor: user.email,
      action: 'assign_role',
      target: `${user.email} -> ${input.roleId}`,
      status: 'success',
      timestamp: now,
      details: `角色分配为 ${input.roleId}`,
    })

    return {
      ...assignment,
      email: user.email,
      displayName: user.displayName,
    }
  },
  listResourceActions(): Record<ResourceIdentifier, ActionVerb[]> {
    return { ...RESOURCE_ACTIONS }
  },
  updatePolicy(input: {
    roleId: Identifier
    resource: ResourceIdentifier
    actions: ActionVerb[]
  }): PolicyRule {
    const filteredActions = sanitizeActions(input.actions, input.resource)
    const index = policies.findIndex(
      (policy) => policy.roleId === input.roleId && policy.resource === input.resource
    )

    const now = new Date().toISOString() as PolicyRule['updatedAt']

    if (index === -1) {
      const newPolicy: PolicyRule = {
        id: `policy-${crypto.randomUUID?.() ?? Date.now()}` as Identifier,
        roleId: input.roleId,
        resource: input.resource,
        actions: filteredActions,
        effect: 'allow',
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-1' as Identifier,
        updatedBy: 'user-1' as Identifier,
      }
      policies = [...policies, newPolicy]
      audits.unshift({
        id: `audit-${crypto.randomUUID?.() ?? Date.now()}` as Identifier,
        actor: 'admin@example.com',
        action: 'update_policy',
        target: `${input.roleId} / ${input.resource}`,
        status: 'success',
        timestamp: now,
        details: `权限设置: ${filteredActions.join(', ') || '无'}`,
      })
      return newPolicy
    }

    const updated: PolicyRule = {
      ...policies[index],
      actions: filteredActions,
      updatedAt: now,
      updatedBy: 'user-1' as Identifier,
    }
    policies = policies.map((policy, mapIndex) =>
      mapIndex === index ? updated : policy
    )

    audits.unshift({
      id: `audit-${crypto.randomUUID?.() ?? Date.now()}` as Identifier,
      actor: 'admin@example.com',
      action: 'update_policy',
      target: `${input.roleId} / ${input.resource}`,
      status: 'success',
      timestamp: now,
      details: `权限设置: ${filteredActions.join(', ') || '无'}`,
    })

    return updated
  },
}
