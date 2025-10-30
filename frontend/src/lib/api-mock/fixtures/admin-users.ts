import type {
  AdminUser,
  AdminUserListParams,
  AdminUserListResponse,
  Identifier,
  ISODateString,
  UserActivity,
  UserStatus,
} from '@/types'
import { faker } from '@faker-js/faker'

const DEFAULT_ROLES = ['admin', 'maintainer', 'viewer'] as const

const toIdentifier = (value: string): Identifier => value as Identifier
const USER_STATUSES: UserStatus[] = [
  'active',
  'inactive',
  'suspended',
  'invited',
]

let seed = faker.string.alphanumeric(6)
faker.seed(seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0))

let users: AdminUser[] = createInitialUsers()
let activities: UserActivity[] = createInitialActivities()

function createInitialUsers(): AdminUser[] {
  const createUser = (input: Partial<AdminUser>): AdminUser => {
    const now = faker.date.recent()
    const createdAt = (
      faker.date.past({ years: 2 }) as Date
    ).toISOString() as ISODateString
    const updatedAt = (now.toISOString() as ISODateString) ?? createdAt

    return {
      id: faker.string.uuid() as Identifier,
      email: faker.internet.email(),
      displayName: faker.person.fullName(),
      avatar: faker.image.avatar(),
      status: faker.helpers.arrayElement(USER_STATUSES),
      roleIds: faker.helpers
        .arrayElements(DEFAULT_ROLES, { min: 1, max: 2 })
        .map((id) => toIdentifier(id)),
      lastLoginAt:
        Math.random() > 0.3
          ? (faker.date.recent({ days: 30 }).toISOString() as ISODateString)
          : undefined,
      createdAt,
      updatedAt,
      createdBy: 'system' as Identifier,
      updatedBy: 'system' as Identifier,
      ...input,
    }
  }

  return [
    createUser({
      displayName: '系统管理员',
      email: 'admin@enterprise.com',
      status: 'active',
      roleIds: [toIdentifier('admin')],
      lastLoginAt: faker.date.recent().toISOString() as ISODateString,
    }),
    createUser({
      displayName: '张三',
      email: 'zhangsan@enterprise.com',
      status: 'active',
      roleIds: [toIdentifier('maintainer')],
      lastLoginAt: faker.date.recent().toISOString() as ISODateString,
    }),
    createUser({
      displayName: '李四',
      email: 'lisi@enterprise.com',
      status: 'active',
      roleIds: [toIdentifier('viewer')],
      lastLoginAt: faker.date.recent().toISOString() as ISODateString,
    }),
    createUser({
      displayName: '王五',
      email: 'wangwu@enterprise.com',
      status: 'suspended',
      roleIds: [toIdentifier('viewer')],
    }),
    createUser({
      displayName: '赵六',
      email: 'zhaoliu@enterprise.com',
      status: 'invited',
      roleIds: [toIdentifier('viewer')],
    }),
    ...Array.from({ length: 10 }, () => createUser({})),
  ]
}

function createInitialActivities(): UserActivity[] {
  return [
    {
      id: faker.string.uuid() as Identifier,
      userId: users[0]?.id || ('user-1' as Identifier),
      action: '登录系统',
      description: '用户登录管理后台',
      timestamp: faker.date.recent().toISOString() as ISODateString,
      ipAddress: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
    },
    {
      id: faker.string.uuid() as Identifier,
      userId: users[1]?.id || ('user-2' as Identifier),
      action: '角色变更',
      description: '用户角色从 viewer 变更为 maintainer',
      timestamp: faker.date.recent({ days: 1 }).toISOString() as ISODateString,
      ipAddress: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
    },
    {
      id: faker.string.uuid() as Identifier,
      userId: users[2]?.id || ('user-3' as Identifier),
      action: '密码重置',
      description: '管理员重置用户密码',
      timestamp: faker.date.recent({ days: 2 }).toISOString() as ISODateString,
      ipAddress: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
    },
  ]
}

export function resetAdminUsersFixtures() {
  users = createInitialUsers()
  activities = createInitialActivities()
  seed = faker.string.alphanumeric(6)
  faker.seed(seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0))
}

function matchSearch(user: AdminUser, search?: string) {
  if (!search) return true
  const term = search.trim().toLowerCase()
  if (term.length === 0) return true

  return (
    user.displayName.toLowerCase().includes(term) ||
    user.email.toLowerCase().includes(term)
  )
}

function matchStatus(user: AdminUser, statuses?: UserStatus[]) {
  if (!statuses || statuses.length === 0) return true
  return statuses.includes(user.status)
}

function matchRoles(user: AdminUser, roleIds?: Identifier[]) {
  if (!roleIds || roleIds.length === 0) return true
  return roleIds.some((roleId) => user.roleIds.includes(roleId))
}

export function listAdminUsersFixture(
  params?: AdminUserListParams
): AdminUserListResponse {
  const page = Math.max(1, Number(params?.page ?? 1))
  const pageSize = Math.max(1, Number(params?.pageSize ?? 10))

  const filtered = users.filter(
    (user) =>
      matchSearch(user, params?.search) &&
      matchStatus(user, params?.statuses) &&
      matchRoles(user, params?.roleIds)
  )

  const start = (page - 1) * pageSize
  const end = start + pageSize
  const items = filtered.slice(start, end)

  return {
    items,
    total: filtered.length,
    page,
    pageSize,
  }
}

export function updateUserRoleFixture(
  userId: Identifier,
  roleIds: Identifier[]
): AdminUser | undefined {
  const target = users.find((user) => user.id === userId)
  if (!target) return undefined

  target.roleIds = roleIds
  target.updatedAt = new Date().toISOString() as ISODateString
  target.updatedBy = 'current-user' as Identifier

  // 添加活动记录
  activities.unshift({
    id: faker.string.uuid() as Identifier,
    userId,
    action: '角色变更',
    description: `用户角色已更新为：${roleIds.join(', ')}`,
    timestamp: new Date().toISOString() as ISODateString,
    ipAddress: faker.internet.ip(),
    userAgent: faker.internet.userAgent(),
  })

  return target
}

export function resetUserPasswordFixture(
  userId: Identifier
): { temporaryPassword: string } | undefined {
  const target = users.find((user) => user.id === userId)
  if (!target) return undefined

  const temporaryPassword = faker.internet.password({
    length: 12,
    memorable: true,
  })

  target.updatedAt = new Date().toISOString() as ISODateString
  target.updatedBy = 'current-user' as Identifier

  // 添加活动记录
  activities.unshift({
    id: faker.string.uuid() as Identifier,
    userId,
    action: '密码重置',
    description: '管理员重置用户密码',
    timestamp: new Date().toISOString() as ISODateString,
    ipAddress: faker.internet.ip(),
    userAgent: faker.internet.userAgent(),
  })

  return { temporaryPassword }
}

export function updateUserStatusFixture(
  userId: Identifier,
  status: UserStatus
): AdminUser | undefined {
  const target = users.find((user) => user.id === userId)
  if (!target) return undefined

  const oldStatus = target.status
  target.status = status
  target.updatedAt = new Date().toISOString() as ISODateString
  target.updatedBy = 'current-user' as Identifier

  if (status === 'active' && oldStatus !== 'active') {
    target.lastLoginAt = new Date().toISOString() as ISODateString
  }

  // 添加活动记录
  activities.unshift({
    id: faker.string.uuid() as Identifier,
    userId,
    action: '状态变更',
    description: `用户状态从 ${oldStatus} 变更为 ${status}`,
    timestamp: new Date().toISOString() as ISODateString,
    ipAddress: faker.internet.ip(),
    userAgent: faker.internet.userAgent(),
  })

  return target
}

export function getUserActivityFixture(userId: Identifier): UserActivity[] {
  return activities
    .filter((activity) => activity.userId === userId)
    .slice(0, 20) // 限制返回最近20条记录
}
