import type { ActionVerb, Identifier, ResourceIdentifier } from '@/types'
import { HttpResponse, http } from 'msw'
import { authFixtures } from '../fixtures/auth'
import { rbacFixtures } from '../fixtures/rbac'

function extractBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null
  const [scheme, token] = headerValue.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

interface UpdatePolicyPayload {
  roleId: Identifier
  resource: ResourceIdentifier
  actions: ActionVerb[]
}

interface AssignRolePayload {
  userId: Identifier
  roleId: Identifier
}

export const rbacHandlers = [
  http.get('*/api/v1/admin/rbac/roles', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json({ roles: rbacFixtures.getRoles() })
  }),

  http.get('*/api/v1/admin/rbac/permissions', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json({
      policies: rbacFixtures.getPolicies(),
      resources: rbacFixtures.listResourceActions(),
    })
  }),

  http.get('*/api/v1/admin/role-members', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json({ members: rbacFixtures.getRoleMembers() })
  }),

  http.get('*/api/v1/admin/audit/events', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json({ audits: rbacFixtures.getAudits() })
  }),

  http.post('*/api/v1/admin/policies/update', async ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const payload = (await request.json()) as Partial<UpdatePolicyPayload>
    if (!payload?.roleId || !payload?.resource || !payload?.actions) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: '缺少角色或权限参数',
        },
        { status: 400 }
      )
    }

    const allowedActions = rbacFixtures.listResourceActions()[payload.resource]
    const invalid = payload.actions.filter(
      (action) => !allowedActions.includes(action)
    )
    if (invalid.length > 0) {
      return HttpResponse.json(
        {
          code: 'INVALID_ACTION',
          message: `无效的权限动作: ${invalid.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const updated = rbacFixtures.updatePolicy({
      roleId: payload.roleId,
      resource: payload.resource,
      actions: payload.actions,
    })

    return HttpResponse.json({ policy: updated })
  }),

  http.post('*/api/v1/admin/rbac/assign-role', async ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const payload = (await request.json()) as Partial<AssignRolePayload>
    if (!payload?.userId || !payload?.roleId) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: '缺少用户或角色参数',
        },
        { status: 400 }
      )
    }

    try {
      const assignment = rbacFixtures.assignRole({
        userId: payload.userId,
        roleId: payload.roleId,
      })
      return HttpResponse.json({ assignment })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ASSIGN_FAILED'
      const status =
        message === 'USER_NOT_FOUND' || message === 'ROLE_NOT_FOUND' ? 404 : 500
      return HttpResponse.json({ code: message, message }, { status })
    }
  }),
]
