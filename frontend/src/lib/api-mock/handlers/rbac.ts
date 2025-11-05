import type { ActionVerb, Identifier, ResourceIdentifier } from '@/types'
import type { PolicyRule, RoleDefinition } from '@/types/rbac'
import { HttpResponse, http } from 'msw'
import { authFixtures } from '../fixtures/auth'
import { rbacFixtures } from '../fixtures/rbac'

interface CreatePolicyPayload {
  subject: string
  resource: ResourceIdentifier
  action: ActionVerb
}

interface UpdatePolicyPayload {
  action: ActionVerb
}

const unauthorized = HttpResponse.json(
  { detail: 'Unauthorized' },
  { status: 401 }
)

function extractBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null
  const [scheme, token] = headerValue.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

function requireAuth(request: Request): boolean {
  const token = extractBearerToken(request.headers.get('authorization'))
  if (!token) return false
  return Boolean(authFixtures.findUserByToken(token))
}

function toApiRole(
  role: RoleDefinition,
  rolePolicies: PolicyRule[]
): { name: string; description: string; permissions: string[] } {
  const permissions = rolePolicies
    .filter((policy) => policy.roleId === role.id)
    .flatMap((policy) =>
      policy.actions.map((action) => `${policy.resource}:${action}`)
    )

  return {
    name: role.name,
    description: role.description,
    permissions,
  }
}

function ensureNumericPolicyId(policyId: Identifier): number {
  return rbacFixtures.ensureNumericPolicyId(policyId)
}

function toApiPolicy(
  policy: PolicyRule,
  roles: RoleDefinition[]
): {
  id: number
  subject: string
  resource: ResourceIdentifier
  action: ActionVerb
} {
  const role = roles.find((item) => item.id === policy.roleId)
  return {
    id: ensureNumericPolicyId(policy.id),
    subject: role?.name ?? policy.roleId,
    resource: policy.resource,
    action: policy.actions[0] ?? 'read',
  }
}

export const rbacHandlers = [
  http.get('*/api/v1/admin/roles', ({ request }) => {
    if (!requireAuth(request)) {
      return unauthorized
    }
    const roles = rbacFixtures.getRoles()
    const policies = rbacFixtures.getPolicies()
    const response = roles.map((role) => toApiRole(role, policies))
    return HttpResponse.json(response)
  }),

  http.get('*/api/v1/admin/policies', ({ request }) => {
    if (!requireAuth(request)) {
      return unauthorized
    }
    const roles = rbacFixtures.getRoles()
    const policies = rbacFixtures.getPolicies()
    const response = policies.map((policy) => toApiPolicy(policy, roles))
    return HttpResponse.json(response)
  }),

  http.post('*/api/v1/admin/policies', async ({ request }) => {
    if (!requireAuth(request)) {
      return unauthorized
    }
    const payload = (await request.json()) as Partial<CreatePolicyPayload>
    if (!payload?.subject || !payload.resource || !payload.action) {
      return HttpResponse.json(
        { code: 'VALIDATION_ERROR', message: '缺少必要的策略参数' },
        { status: 400 }
      )
    }

    const roles = rbacFixtures.getRoles()
    const targetRole = roles.find(
      (role) =>
        role.name === payload.subject ||
        role.id === (payload.subject as Identifier)
    )
    if (!targetRole) {
      return HttpResponse.json(
        { code: 'ROLE_NOT_FOUND', message: '目标角色不存在' },
        { status: 404 }
      )
    }

    const allowedActions = rbacFixtures.listResourceActions()[payload.resource]
    if (!allowedActions?.includes(payload.action)) {
      return HttpResponse.json(
        { code: 'INVALID_ACTION', message: '动作不被允许' },
        { status: 400 }
      )
    }

    const existing = rbacFixtures
      .getPolicies()
      .find(
        (policy) =>
          policy.roleId === targetRole.id &&
          policy.resource === payload.resource
      )

    const created = existing
      ? rbacFixtures.updatePolicy({
          roleId: targetRole.id,
          resource: payload.resource,
          actions: [payload.action],
        })
      : rbacFixtures.createPolicyRule({
          roleId: targetRole.id,
          resource: payload.resource,
          action: payload.action,
        })

    return HttpResponse.json(toApiPolicy(created, roles), { status: 201 })
  }),

  http.patch('*/api/v1/admin/policies/:id', async ({ request, params }) => {
    if (!requireAuth(request)) {
      return unauthorized
    }

    const numericId = Number(params.id)
    if (!Number.isFinite(numericId)) {
      return HttpResponse.json(
        { code: 'INVALID_ID', message: '策略 ID 无效' },
        { status: 400 }
      )
    }

    const policyIdentifier = rbacFixtures.resolvePolicyIdentifier(numericId)
    if (!policyIdentifier) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '策略不存在' },
        { status: 404 }
      )
    }

    const payload = (await request.json()) as Partial<UpdatePolicyPayload>
    if (!payload?.action) {
      return HttpResponse.json(
        { code: 'VALIDATION_ERROR', message: '缺少动作参数' },
        { status: 400 }
      )
    }

    const policies = rbacFixtures.getPolicies()
    const targetPolicy = policies.find(
      (policy) => policy.id === policyIdentifier
    )
    if (!targetPolicy) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '策略不存在' },
        { status: 404 }
      )
    }

    const allowedActions =
      rbacFixtures.listResourceActions()[targetPolicy.resource]
    if (!allowedActions?.includes(payload.action)) {
      return HttpResponse.json(
        { code: 'INVALID_ACTION', message: '动作不被允许' },
        { status: 400 }
      )
    }

    const updated = rbacFixtures.updatePolicy({
      roleId: targetPolicy.roleId,
      resource: targetPolicy.resource,
      actions: [payload.action],
    })

    const roles = rbacFixtures.getRoles()
    return HttpResponse.json(toApiPolicy(updated, roles))
  }),

  http.delete('*/api/v1/admin/policies/:id', ({ request, params }) => {
    if (!requireAuth(request)) {
      return unauthorized
    }

    const numericId = Number(params.id)
    if (!Number.isFinite(numericId)) {
      return HttpResponse.json(
        { code: 'INVALID_ID', message: '策略 ID 无效' },
        { status: 400 }
      )
    }

    const policyIdentifier = rbacFixtures.resolvePolicyIdentifier(numericId)
    if (!policyIdentifier) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '策略不存在' },
        { status: 404 }
      )
    }

    const deleted = rbacFixtures.deletePolicy(policyIdentifier)
    if (!deleted) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '策略不存在' },
        { status: 404 }
      )
    }

    return new HttpResponse(null, { status: 204 })
  }),

  http.get('*/api/v1/admin/audit', ({ request }) => {
    if (!requireAuth(request)) {
      return unauthorized
    }
    const audits = rbacFixtures.getAudits()
    return HttpResponse.json({
      audits,
      total: audits.length,
      page: 1,
      limit: audits.length,
    })
  }),
]
