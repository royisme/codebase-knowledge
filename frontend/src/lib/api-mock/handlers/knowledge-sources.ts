import type {
  BulkOperationPayload,
  CreateKnowledgeSourcePayload,
  Identifier,
  KnowledgeSourceListParams,
  KnowledgeSourceStatus,
  UpdateKnowledgeSourcePayload,
} from '@/types'
import { HttpResponse, http } from 'msw'
import { authFixtures } from '../fixtures/auth'
import {
  bulkOperationFixture,
  createKnowledgeSourceFixture,
  deleteKnowledgeSourceFixture,
  listKnowledgeSourcesFixture,
  listRepositoriesFixture,
  triggerKnowledgeSourceSyncFixture,
  updateKnowledgeSourceFixture,
} from '../fixtures/knowledge-sources'
import { isTestEnvironment, isValidTestToken } from '../test-helpers'

function extractBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null
  const [scheme, token] = headerValue.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const token = extractBearerToken(authHeader)

  console.log('[DEBUG] isAuthorized check:', {
    authHeader,
    token,
    isTestEnv: isTestEnvironment(),
    isValidToken: isValidTestToken(token),
  })

  // 在测试环境中，允许 mock token
  if (isTestEnvironment() && isValidTestToken(token)) {
    console.log('[DEBUG] Test environment - token valid')
    return true
  }

  // 正常环境检查 token
  if (!token) {
    console.log('[DEBUG] No token provided')
    return false
  }
  const found = Boolean(authFixtures.findUserByToken(token))
  console.log('[DEBUG] Token lookup result:', found)
  return found
}

function parseListParams(url: URL): KnowledgeSourceListParams {
  const statuses = url.searchParams.getAll(
    'statuses'
  ) as KnowledgeSourceStatus[]
  return {
    page: Number(url.searchParams.get('page') ?? undefined),
    pageSize: Number(url.searchParams.get('pageSize') ?? undefined),
    search: url.searchParams.get('search') ?? undefined,
    statuses: statuses.length > 0 ? statuses : undefined,
  }
}

export const knowledgeSourceHandlers = [
  http.get('*/api/v1/admin/sources', ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const url = new URL(request.url)

    // 检查是否是仓库管理页面请求（通过 referer 或特定参数判断）
    // 如果有 page/size 参数，使用 repositories fixture（支持分页）
    const hasPageParam =
      url.searchParams.has('page') || url.searchParams.has('size')

    if (hasPageParam) {
      // 使用 repositories fixture（支持完整分页）
      const params = {
        statuses: url.searchParams.getAll('statuses'),
        search: url.searchParams.get('search') ?? undefined,
        page: Number(url.searchParams.get('page')) || 1,
        size:
          Number(
            url.searchParams.get('size') || url.searchParams.get('pageSize')
          ) || 20,
      }
      const response = listRepositoriesFixture(params)
      return HttpResponse.json(response)
    } else {
      // 使用 knowledge sources fixture（原有逻辑）
      const params = parseListParams(url)
      const response = listKnowledgeSourcesFixture(params)
      return HttpResponse.json(response)
    }
  }),

  http.post('*/api/v1/admin/sources', async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const payload =
      (await request.json()) as Partial<CreateKnowledgeSourcePayload>
    if (!payload?.name || !payload?.repositoryUrl) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: '名称与仓库地址为必填项',
        },
        { status: 400 }
      )
    }
    if (
      !payload.defaultBranch ||
      !payload.credentialMode ||
      !payload.parserConfig
    ) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: '请完整填写默认分支、凭据模式与解析配置',
        },
        { status: 400 }
      )
    }

    const entity = createKnowledgeSourceFixture(
      payload as CreateKnowledgeSourcePayload
    )
    return HttpResponse.json(entity, { status: 201 })
  }),

  http.patch('*/api/v1/admin/sources/:id', async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const payload = (await request.json()) as UpdateKnowledgeSourcePayload
    const updated = updateKnowledgeSourceFixture(
      params.id as Identifier,
      payload
    )
    if (!updated) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '知识源不存在或已删除' },
        { status: 404 }
      )
    }
    return HttpResponse.json(updated)
  }),

  http.delete('*/api/v1/admin/sources/:id', ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const success = deleteKnowledgeSourceFixture(params.id as Identifier)
    if (!success) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '知识源不存在或已删除' },
        { status: 404 }
      )
    }
    return HttpResponse.json(null, { status: 204 })
  }),

  http.post('*/api/v1/admin/sources/:id/sync', ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const updated = triggerKnowledgeSourceSyncFixture(params.id as Identifier)
    if (!updated) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '知识源不存在或已删除' },
        { status: 404 }
      )
    }
    return HttpResponse.json({
      source: updated,
      taskId: updated.lastTaskId,
      message: '已触发增量同步任务',
    })
  }),

  http.post('*/api/v1/admin/sources/bulk', async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const payload = (await request.json()) as BulkOperationPayload

    if (
      !payload?.ids ||
      !Array.isArray(payload.ids) ||
      payload.ids.length === 0
    ) {
      return HttpResponse.json(
        { code: 'VALIDATION_ERROR', message: '请提供有效的知识源 ID 列表' },
        { status: 400 }
      )
    }

    if (
      !payload?.operation ||
      !['enable', 'disable', 'sync'].includes(payload.operation)
    ) {
      return HttpResponse.json(
        { code: 'VALIDATION_ERROR', message: '无效的操作类型' },
        { status: 400 }
      )
    }

    const response = bulkOperationFixture(payload)
    return HttpResponse.json(response)
  }),
]
