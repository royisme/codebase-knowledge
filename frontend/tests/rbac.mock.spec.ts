import { beforeEach, describe, expect, it } from 'vitest'

import {
  createPolicy,
  deletePolicy,
  fetchAuditLogs,
  fetchPolicies,
  fetchRoles,
  updatePolicyAction,
} from '@/lib/rbac-service'
import { resetRbacFixtures } from '@/lib/api-mock/fixtures/rbac'
import { setupTestAuth } from '@/lib/test-utils'

describe('RBAC API Mock', () => {
  beforeEach(() => {
    resetRbacFixtures()
    setupTestAuth()
  })

  it('返回角色列表并包含权限描述', async () => {
    const roles = await fetchRoles()
    expect(Array.isArray(roles)).toBe(true)
    expect(roles.length).toBeGreaterThan(0)
    const firstRole = roles[0]
    expect(firstRole.name).toBeDefined()
    expect(Array.isArray(firstRole.permissions)).toBe(true)
  })

  it('支持创建、更新与删除策略', async () => {
    const initialPolicies = await fetchPolicies()

    const created = await createPolicy({
      subject: 'Viewer',
      resource: 'policies',
      action: 'read',
    })
    expect(created.subject).toBe('Viewer')
    expect(created.resource).toBe('policies')

    const afterCreate = await fetchPolicies()
    expect(afterCreate.length).toBe(initialPolicies.length + 1)

    const updated = await updatePolicyAction(created.id, 'admin')
    expect(updated.action).toBe('admin')

    await deletePolicy(created.id)
    const afterDelete = await fetchPolicies()
    expect(afterDelete.length).toBe(initialPolicies.length)
  })

  it('策略更新会写入审计日志', async () => {
    const policies = await fetchPolicies()
    expect(policies.length).toBeGreaterThan(0)
    const target = policies[0]
    const nextAction = target.action === 'admin' ? 'read' : 'admin'

    await updatePolicyAction(target.id, nextAction)
    const audits = await fetchAuditLogs()

    expect(audits.total).toBeGreaterThan(0)
    expect(audits.audits[0].action).toBe('update_policy')
  })
})
