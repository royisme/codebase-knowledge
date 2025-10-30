import type {
  AdminUserListParams,
  Identifier,
  ResetPasswordPayload,
  UpdateUserStatusPayload,
  UserStatus,
} from '@/types'
import { HttpResponse, http } from 'msw'
import {
  getUserActivityFixture,
  listAdminUsersFixture,
  resetAdminUsersFixtures,
  resetUserPasswordFixture,
  updateUserRoleFixture,
  updateUserStatusFixture,
} from '../fixtures/admin-users'

function parseUserListParams(url: URL): AdminUserListParams {
  const statuses = url.searchParams.getAll('statuses') as UserStatus[]
  const roleIds = url.searchParams.getAll('roleId') as Identifier[]
  return {
    page: Number(url.searchParams.get('page') ?? undefined),
    pageSize: Number(url.searchParams.get('pageSize') ?? undefined),
    search: url.searchParams.get('search') ?? undefined,
    statuses: statuses.length > 0 ? statuses : undefined,
    roleIds: roleIds.length > 0 ? roleIds : undefined,
  }
}

export const adminUserHandlers = [
  http.get('*/api/admin/users', ({ request }) => {
    const params = parseUserListParams(new URL(request.url))
    const response = listAdminUsersFixture(params)
    return HttpResponse.json(response)
  }),

  http.patch('*/api/admin/users/:userId/roles', async ({ params, request }) => {
    const userId = params.userId as Identifier
    const payload = (await request.json()) as { roleIds: Identifier[] }

    if (!payload?.roleIds || !Array.isArray(payload.roleIds)) {
      return HttpResponse.json(
        { code: 'VALIDATION_ERROR', message: '角色列表不能为空' },
        { status: 400 }
      )
    }

    const updated = updateUserRoleFixture(userId, payload.roleIds)
    if (!updated) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '用户不存在' },
        { status: 404 }
      )
    }
    return HttpResponse.json(updated)
  }),

  http.post(
    '*/api/admin/users/:userId/reset-password',
    async ({ params, request }) => {
      const userId = params.userId as Identifier
      const payload = (await request.json()) as ResetPasswordPayload

      const result = resetUserPasswordFixture(userId)
      if (!result) {
        return HttpResponse.json(
          { code: 'NOT_FOUND', message: '用户不存在' },
          { status: 404 }
        )
      }

      return HttpResponse.json({
        temporaryPassword:
          payload.temporaryPassword || result.temporaryPassword,
        message: '临时密码已生成',
      })
    }
  ),

  http.patch(
    '*/api/admin/users/:userId/status',
    async ({ params, request }) => {
      const userId = params.userId as Identifier
      const payload = (await request.json()) as UpdateUserStatusPayload

      if (!payload?.status) {
        return HttpResponse.json(
          { code: 'VALIDATION_ERROR', message: '用户状态不能为空' },
          { status: 400 }
        )
      }

      const updated = updateUserStatusFixture(userId, payload.status)
      if (!updated) {
        return HttpResponse.json(
          { code: 'NOT_FOUND', message: '用户不存在' },
          { status: 404 }
        )
      }
      return HttpResponse.json(updated)
    }
  ),

  http.get('*/api/admin/users/:userId/activity', ({ params }) => {
    const userId = params.userId as Identifier
    const activities = getUserActivityFixture(userId)
    return HttpResponse.json(activities)
  }),

  // 管理端点：重置所有数据
  http.post('*/api/admin/users/_reset', () => {
    resetAdminUsersFixtures()
    return HttpResponse.json({ message: '用户数据已重置' })
  }),
]
