import { beforeEach, describe, expect, it } from 'vitest'

import type { Identifier } from '@/types'

import {
  assignRole,
  fetchPolicies,
  fetchRoleMembers,
  fetchRoles,
  updatePolicy,
} from '@/lib/rbac-service'

describe('RBAC mock baseline', () => {
  beforeEach(async () => {
    // Ensure tests use fresh data by resetting viewer policy to read only
    await updatePolicy({
      roleId: 'role-viewer',
      resource: 'knowledge_sources',
      actions: ['read'],
    })
  })

  it('provides minimal roles', async () => {
    const roles = await fetchRoles()
    expect(roles.map((role) => role.id)).toEqual([
      'role-admin',
      'role-viewer',
    ])
  })

  it('returns policies limited to read/admin actions', async () => {
    const { policies } = await fetchPolicies()
    const allowed = new Set(['read', 'admin'])
    for (const policy of policies) {
      expect(policy.actions.every((action) => allowed.has(action))).toBe(true)
    }
  })

  it('allows toggling viewer manage permission within allowed actions', async () => {
    const response = await updatePolicy({
      roleId: 'role-viewer',
      resource: 'knowledge_sources',
      actions: ['read', 'admin'],
    })
    expect(response.actions).toEqual(['read', 'admin'])

    const reverted = await updatePolicy({
      roleId: 'role-viewer',
      resource: 'knowledge_sources',
      actions: ['read'],
    })
    expect(reverted.actions).toEqual(['read'])
  })

  it('allows reassigning role members within mock data', async () => {
    const members = await fetchRoleMembers()
    expect(members.length).toBeGreaterThan(0)
    const viewer = members.find((member) => member.roleId === 'role-viewer')
    expect(viewer).toBeDefined()

    if (!viewer) return

    const updated = await assignRole({
      userId: viewer.userId,
      roleId: 'role-admin',
    })
    expect(updated.roleId).toBe('role-admin')

    const reverted = await assignRole({
      userId: viewer.userId,
      roleId: 'role-viewer',
    })
    expect(reverted.roleId).toBe('role-viewer')
  })

  it('rejects assigning role to unknown user', async () => {
    await expect(
      assignRole({
        userId: 'unknown-user' as Identifier,
        roleId: 'role-admin',
      })
    ).rejects.toHaveProperty('status', 404)
  })
})
