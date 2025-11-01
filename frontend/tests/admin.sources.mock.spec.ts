import { beforeEach, describe, expect, it } from 'vitest'

import {
  listKnowledgeSources,
  createKnowledgeSource,
  updateKnowledgeSource,
  deleteKnowledgeSource,
  triggerKnowledgeSourceSync,
} from '@/lib/knowledge-source-service'
import { resetKnowledgeSourceFixtures } from '@/lib/api-mock/fixtures/knowledge-sources'
import { setupTestAuth } from '@/lib/test-utils'
import type { CreateKnowledgeSourcePayload } from '@/types'

describe('KnowledgeSources API Mock Tests', () => {
  beforeEach(() => {
    resetKnowledgeSourceFixtures()
    setupTestAuth()
  })

  describe('1. 知识源列表功能', () => {
    it('应该正确返回知识源列表', async () => {
      const result = await listKnowledgeSources({ page: 1, pageSize: 10 })

      expect(result.items).toBeDefined()
      expect(result.total).toBeGreaterThan(0)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)

      // 验证主要字段存在
      const firstItem = result.items[0]
      expect(firstItem.id).toBeDefined()
      expect(firstItem.name).toBeDefined()
      expect(firstItem.repositoryUrl).toBeDefined()
      expect(firstItem.status).toBeDefined()
    })

    it('应该支持搜索功能', async () => {
      const result = await listKnowledgeSources({
        page: 1,
        pageSize: 10,
        search: 'Frontend'
      })

      expect(result.items.length).toBeGreaterThan(0)
      expect(result.items.every(item =>
        item.name.includes('Frontend') ||
        item.repositoryUrl.includes('Frontend')
      )).toBe(true)
    })

    it('应该支持状态筛选', async () => {
      const result = await listKnowledgeSources({
        page: 1,
        pageSize: 10,
        statuses: ['active']
      })

      expect(result.items.every(item => item.status === 'active')).toBe(true)
    })

    it('应该支持组合筛选', async () => {
      const result = await listKnowledgeSources({
        page: 1,
        pageSize: 10,
        search: 'API',
        statuses: ['active']
      })

      expect(result.items.every(item =>
        item.status === 'active' &&
        (item.name.includes('API') || item.repositoryUrl.includes('API'))
      )).toBe(true)
    })
  })

  describe('2. 新增知识源功能', () => {
    it('应该正确创建知识源', async () => {
      const payload: CreateKnowledgeSourcePayload = {
        name: 'Test Source',
        repositoryUrl: 'git@github.com:test/test.git',
        defaultBranch: 'main',
        credentialMode: 'ssh',
        parserConfig: {
          languages: ['python'],
          enableIncrementalRefresh: true,
        },
      }

      const result = await createKnowledgeSource(payload)

      expect(result.name).toBe(payload.name)
      expect(result.repositoryUrl).toBe(payload.repositoryUrl)
      expect(result.defaultBranch).toBe(payload.defaultBranch)
      expect(result.credentialMode).toBe(payload.credentialMode)
      expect(result.status).toBe('active')
      expect(result.parserConfig).toEqual(payload.parserConfig)
      expect(result.id).toBeDefined()
    })

    it('应该在创建失败时抛出错误', async () => {
      const invalidPayload = {
        name: '', // 空名称应该导致验证失败
        repositoryUrl: '',
        defaultBranch: 'main',
        credentialMode: 'ssh' as const,
        parserConfig: {
          languages: ['python'],
          enableIncrementalRefresh: true,
        },
      }

      await expect(createKnowledgeSource(invalidPayload)).rejects.toHaveProperty('status', 400)
    })
  })

  describe('3. 更新知识源功能', () => {
    it('应该正确更新知识源状态', async () => {
      // 先创建一个知识源来测试更新
      const payload: CreateKnowledgeSourcePayload = {
        name: 'Test Update Source',
        repositoryUrl: 'git@github.com:test/update.git',
        defaultBranch: 'main',
        credentialMode: 'ssh',
        parserConfig: {
          languages: ['python'],
          enableIncrementalRefresh: true,
        },
      }
      const created = await createKnowledgeSource(payload)

      const result = await updateKnowledgeSource(created.id, { status: 'disabled' })

      expect(result.id).toBe(created.id)
      expect(result.status).toBe('disabled')
      expect(result.updatedAt).not.toBe(created.updatedAt)
    })

    it('应该正确更新知识源配置', async () => {
      // 先创建一个知识源来测试配置更新
      const payload: CreateKnowledgeSourcePayload = {
        name: 'Test Config Update Source',
        repositoryUrl: 'git@github.com:test/config-update.git',
        defaultBranch: 'main',
        credentialMode: 'https',
        parserConfig: {
          languages: ['python'],
          enableIncrementalRefresh: true,
        },
      }
      const created = await createKnowledgeSource(payload)

      const newParserConfig = {
        languages: ['typescript', 'javascript'],
        pathAllowList: ['src/', 'lib/'],
        maxDepth: 5,
        enableIncrementalRefresh: false,
      }

      const result = await updateKnowledgeSource(created.id, {
        parserConfig: newParserConfig
      })

      expect(result.id).toBe(created.id)
      expect(result.parserConfig).toEqual(newParserConfig)
    })

    it('应该在更新不存在的知识源时返回404', async () => {
    const nonExistentId = 'non-existent-id' as Identifier

      await expect(updateKnowledgeSource(nonExistentId, { status: 'disabled' }))
        .rejects.toHaveProperty('status', 404)
    })
  })

  describe('4. 删除知识源功能', () => {
    it('应该正确删除知识源', async () => {
      // 先创建一个知识源
      const payload: CreateKnowledgeSourcePayload = {
        name: 'To Delete',
        repositoryUrl: 'git@github.com:delete/delete.git',
        defaultBranch: 'main',
        credentialMode: 'https',
        parserConfig: {
          languages: ['typescript'],
          enableIncrementalRefresh: false,
        },
      }
      const created = await createKnowledgeSource(payload)

      // 然后删除它
      await expect(deleteKnowledgeSource(created.id)).resolves.not.toThrow()

      // 验证删除后不能再在列表中找到
      const listAfterDelete = await listKnowledgeSources()
      expect(listAfterDelete.items.some(item => item.id === created.id)).toBe(false)
    })

    it('应该在删除不存在的知识源时返回404', async () => {
      const nonExistentId = 'non-existent-id' as Identifier

      await expect(deleteKnowledgeSource(nonExistentId))
        .rejects.toHaveProperty('status', 404)
    })
  })

  describe('5. 触发同步功能', () => {
    it('应该正确触发知识源同步', async () => {
      // 先创建一个知识源来测试同步
      const payload: CreateKnowledgeSourcePayload = {
        name: 'Test Sync Source',
        repositoryUrl: 'git@github.com:test/sync.git',
        defaultBranch: 'main',
        credentialMode: 'token',
        parserConfig: {
          languages: ['javascript'],
          enableIncrementalRefresh: true,
        },
      }
      const created = await createKnowledgeSource(payload)

      const result = await triggerKnowledgeSourceSync(created.id)

      expect(result.source.id).toBe(created.id)
      expect(result.taskId).toBeDefined()
      expect(result.message).toBe('已触发增量同步任务')
      expect(result.source.status).toBe('syncing')
      expect(result.source.lastTaskId).toBe(result.taskId)
    })

    it('应该在触发不存在的知识源同步时返回404', async () => {
      const nonExistentId = 'non-existent-id' as Identifier

      await expect(triggerKnowledgeSourceSync(nonExistentId))
        .rejects.toHaveProperty('status', 404)
    })

    it('应该在同步后更新知识源状态', async () => {
      // 先创建一个知识源来测试状态更新
      const payload: CreateKnowledgeSourcePayload = {
        name: 'Test Status Sync Source',
        repositoryUrl: 'git@github.com:test/status-sync.git',
        defaultBranch: 'main',
        credentialMode: 'ssh',
        parserConfig: {
          languages: ['python'],
          enableIncrementalRefresh: false,
        },
      }
      const created = await createKnowledgeSource(payload)

      // 触发同步
      const syncResult = await triggerKnowledgeSourceSync(created.id)

      // 验证同步响应
      expect(syncResult.source.status).toBe('syncing')
      expect(syncResult.source.lastTaskId).toBe(syncResult.taskId)
    })
  })

  describe('6. 综合场景测试', () => {
    it('应该支持完整的知识源生命周期', async () => {
      // 1. 创建知识源
      const payload: CreateKnowledgeSourcePayload = {
        name: 'Lifecycle Test Source',
        repositoryUrl: 'git@github.com:test/lifecycle.git',
        defaultBranch: 'main',
        credentialMode: 'token',
        parserConfig: {
          languages: ['python', 'typescript'],
          enableIncrementalRefresh: true,
        },
      }

      const created = await createKnowledgeSource(payload)
      expect(created.status).toBe('active')

      // 2. 更新状态为禁用
      const disabled = await updateKnowledgeSource(created.id, { status: 'disabled' })
      expect(disabled.status).toBe('disabled')

      // 3. 重新启用
      const reactivated = await updateKnowledgeSource(created.id, { status: 'active' })
      expect(reactivated.status).toBe('active')

      // 4. 触发同步
      const syncResult = await triggerKnowledgeSourceSync(created.id)
      expect(syncResult.source.status).toBe('syncing')

      // 5. 删除知识源
      await expect(deleteKnowledgeSource(created.id)).resolves.not.toThrow()

      // 6. 验证已删除
      const finalList = await listKnowledgeSources()
      expect(finalList.items.some(item => item.id === created.id)).toBe(false)
    })

    it('应该正确处理分页', async () => {
      // 测试第一页
      const page1 = await listKnowledgeSources({ page: 1, pageSize: 2 })
      expect(page1.items.length).toBeLessThanOrEqual(2)
      expect(page1.page).toBe(1)
      expect(page1.pageSize).toBe(2)

      // 测试第二页（如果有足够的记录）
      if (page1.total > 2) {
        const page2 = await listKnowledgeSources({ page: 2, pageSize: 2 })
        expect(page2.items.length).toBeLessThanOrEqual(2)
        expect(page2.page).toBe(2)
        expect(page2.pageSize).toBe(2)

        // 确保两页的内容不重复
        const page1Ids = page1.items.map(item => item.id)
        const page2Ids = page2.items.map(item => item.id)
        const intersection = page1Ids.filter(id => page2Ids.includes(id))
        expect(intersection.length).toBe(0)
      }
    })
  })
})
