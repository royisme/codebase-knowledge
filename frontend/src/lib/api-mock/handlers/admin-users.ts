import type {
  AdminUserListParams,
  Identifier,
  ResetPasswordPayload,
  UpdateUserStatusPayload,
  UserStatus,
} from '@/types'
import { HttpResponse, http } from 'msw'
import { authFixtures } from '../fixtures/auth'
import {
  getUserActivityFixture,
  listAdminUsersFixture,
  resetAdminUsersFixtures,
  resetUserPasswordFixture,
  updateUserRoleFixture,
  updateUserStatusFixture,
} from '../fixtures/admin-users'

function extractBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null
  const [scheme, token] = headerValue.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

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
  http.get('*/api/v1/admin/users', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const params = parseUserListParams(new URL(request.url))
    const response = listAdminUsersFixture(params)
    return HttpResponse.json(response)
  }),

  http.patch('*/api/v1/admin/users/:userId/roles', async ({ params, request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
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
    '*/api/v1/admin/users/:userId/reset-password',
    async ({ params, request }) => {
      const token = extractBearerToken(request.headers.get('authorization'))
      if (!token || !authFixtures.findUserByToken(token)) {
        return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
      }
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
    '*/api/v1/admin/users/:userId/status',
    async ({ params, request }) => {
      const token = extractBearerToken(request.headers.get('authorization'))
      if (!token || !authFixtures.findUserByToken(token)) {
        return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
      }
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

  http.get('*/api/v1/admin/users/:userId/activity', ({ params, request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const userId = params.userId as Identifier
    const activities = getUserActivityFixture(userId)
    return HttpResponse.json(activities)
  }),

  // 管理端点：重置所有数据
  http.post('*/api/v1/admin/users/_reset', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    resetAdminUsersFixtures()
    return HttpResponse.json({ message: '用户数据已重置' })
  }),
]
