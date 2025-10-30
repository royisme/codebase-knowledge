import type {
  BulkOperationPayload,
  CreateKnowledgeSourcePayload,
  Identifier,
  KnowledgeSourceListParams,
  KnowledgeSourceStatus,
  UpdateKnowledgeSourcePayload,
} from '@/types'
import { HttpResponse, http } from 'msw'
import {
  bulkOperationFixture,
  createKnowledgeSourceFixture,
  deleteKnowledgeSourceFixture,
  listKnowledgeSourcesFixture,
  triggerKnowledgeSourceSyncFixture,
  updateKnowledgeSourceFixture,
} from '../fixtures/knowledge-sources'

function parseListParams(url: URL): KnowledgeSourceListParams {
  const statuses = url.searchParams.getAll('status') as KnowledgeSourceStatus[]
  return {
    page: Number(url.searchParams.get('page') ?? undefined),
    pageSize: Number(url.searchParams.get('pageSize') ?? undefined),
    search: url.searchParams.get('search') ?? undefined,
    statuses: statuses.length > 0 ? statuses : undefined,
  }
}

export const knowledgeSourceHandlers = [
  http.get('*/api/admin/sources', ({ request }) => {
    const params = parseListParams(new URL(request.url))
    const response = listKnowledgeSourcesFixture(params)
    return HttpResponse.json(response)
  }),

  http.post('*/api/admin/sources', async ({ request }) => {
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

  http.patch('*/api/admin/sources/:id', async ({ params, request }) => {
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

  http.delete('*/api/admin/sources/:id', ({ params }) => {
    const success = deleteKnowledgeSourceFixture(params.id as Identifier)
    if (!success) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '知识源不存在或已删除' },
        { status: 404 }
      )
    }
    return HttpResponse.json(null, { status: 204 })
  }),

  http.post('*/api/admin/sources/:id/sync', ({ params }) => {
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

  http.post('*/api/admin/sources/bulk', async ({ request }) => {
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
