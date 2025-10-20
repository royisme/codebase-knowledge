import { HttpResponse, http } from 'msw'

import type { ActionVerb, Identifier, ResourceIdentifier } from '@/types'

import { rbacFixtures } from '../fixtures/rbac'

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
  http.get('*/admin/roles', () => {
    return HttpResponse.json({ roles: rbacFixtures.getRoles() })
  }),

  http.get('*/admin/policies', () => {
    return HttpResponse.json({
      policies: rbacFixtures.getPolicies(),
      resources: rbacFixtures.listResourceActions(),
    })
  }),

  http.get('*/admin/role-members', () => {
    return HttpResponse.json({ members: rbacFixtures.getRoleMembers() })
  }),

  http.get('*/admin/audit', () => {
    return HttpResponse.json({ audits: rbacFixtures.getAudits() })
  }),

  http.post('*/admin/policies/update', async ({ request }) => {
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
    const invalid = payload.actions.filter((action) => !allowedActions.includes(action))
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

  http.post('*/admin/role-members/assign', async ({ request }) => {
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
      const status = message === 'USER_NOT_FOUND' || message === 'ROLE_NOT_FOUND' ? 404 : 500
      return HttpResponse.json({ code: message, message }, { status })
    }
  }),
]
