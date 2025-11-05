import type {
  BulkOperationPayload,
  CreateKnowledgeSourcePayload,
  Identifier,
  KnowledgeSource,
  KnowledgeSourceListParams,
  KnowledgeSourceStatus,
  ParserConfig,
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

const MSW_DEBUG = process.env.MSW_DEBUG === 'true'

function debugLog(...args: unknown[]) {
  if (MSW_DEBUG) {
    // eslint-disable-next-line no-console
    console.debug('[MSW]', ...args)
  }
}

function extractBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null
  const [scheme, token] = headerValue.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const token = extractBearerToken(authHeader)

  // 在测试环境中，允许 mock token
  if (isTestEnvironment() && isValidTestToken(token)) {
    return true
  }

  // 正常环境检查 token
  if (!token) {
    debugLog('Missing token for request', request.url)
    return false
  }
  const found = Boolean(authFixtures.findUserByToken(token))
  debugLog(
    'Token lookup result for request',
    request.url,
    found ? 'valid' : 'invalid'
  )
  return found
}

function parseListParams(url: URL): KnowledgeSourceListParams {
  const statusesFromQuery = url.searchParams.getAll(
    'statuses'
  ) as KnowledgeSourceStatus[]
  const sizeParam = url.searchParams.get('size')
  const isActiveParam = url.searchParams.get('is_active')

  let statuses: KnowledgeSourceStatus[] | undefined =
    statusesFromQuery.length > 0 ? statusesFromQuery : undefined

  if (isActiveParam !== null) {
    const isActive = isActiveParam === 'true'
    statuses = [isActive ? 'active' : 'disabled']
  }

  return {
    page: Number(url.searchParams.get('page') ?? undefined),
    pageSize: Number(
      url.searchParams.get('pageSize') ?? sizeParam ?? undefined
    ),
    search: url.searchParams.get('search') ?? undefined,
    statuses,
  }
}

type ApiKnowledgeSource = {
  id: Identifier
  name: string
  description: string | null
  source_type: 'code'
  connection_config: {
    repo_url: string
    default_branch: string
    credential_mode: KnowledgeSource['credentialMode']
  }
  source_metadata: {
    parser_config: {
      languages: string[]
      path_allow_list?: string[]
      max_depth?: number
      enable_incremental_refresh?: boolean
    }
    last_task_id?: Identifier | null
  }
  is_active: boolean
  last_synced_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  created_by?: Identifier | null
  updated_by?: Identifier | null
}

const toApiKnowledgeSource = (source: KnowledgeSource): ApiKnowledgeSource => ({
  id: source.id,
  name: source.name,
  description: source.description ?? null,
  source_type: 'code',
  connection_config: {
    repo_url: source.repositoryUrl,
    default_branch: source.defaultBranch,
    credential_mode: source.credentialMode,
  },
  source_metadata: {
    parser_config: {
      languages: source.parserConfig.languages,
      path_allow_list: source.parserConfig.pathAllowList ?? undefined,
      max_depth: source.parserConfig.maxDepth,
      enable_incremental_refresh: source.parserConfig.enableIncrementalRefresh,
    },
    last_task_id: source.lastTaskId ?? null,
  },
  is_active: source.status === 'active',
  last_synced_at: source.lastSyncedAt ?? null,
  created_at: source.createdAt ?? null,
  updated_at: source.updatedAt ?? null,
  created_by: source.createdBy ?? null,
  updated_by: source.updatedBy ?? null,
})

const parseParserConfig = (
  config?: Record<string, unknown>
): ParserConfig | undefined => {
  if (!config) return undefined
  const languages = Array.isArray(config.languages)
    ? (config.languages as unknown[]).map((item) => String(item))
    : []

  return {
    languages,
    pathAllowList: Array.isArray(config.path_allow_list)
      ? (config.path_allow_list as unknown[]).map((item) => String(item))
      : undefined,
    maxDepth:
      typeof config.max_depth === 'number' ? config.max_depth : undefined,
    enableIncrementalRefresh:
      typeof config.enable_incremental_refresh === 'boolean'
        ? config.enable_incremental_refresh
        : true,
  }
}

const mapCreatePayload = (
  payload: Record<string, unknown>
): CreateKnowledgeSourcePayload | null => {
  const connectionConfig = payload.connection_config as
    | Record<string, unknown>
    | undefined
  const metadata = payload.metadata as Record<string, unknown> | undefined
  const parserConfig = parseParserConfig(
    metadata?.parser_config as Record<string, unknown> | undefined
  )

  const name = typeof payload.name === 'string' ? payload.name.trim() : ''
  const repoUrl =
    typeof connectionConfig?.repo_url === 'string'
      ? connectionConfig.repo_url.trim()
      : ''
  const defaultBranch =
    typeof connectionConfig?.default_branch === 'string'
      ? connectionConfig.default_branch.trim()
      : ''
  const credentialMode =
    typeof connectionConfig?.credential_mode === 'string'
      ? (connectionConfig.credential_mode as KnowledgeSource['credentialMode'])
      : undefined

  if (!name || !repoUrl || !defaultBranch || !credentialMode || !parserConfig) {
    return null
  }

  return {
    name,
    repositoryUrl: repoUrl,
    defaultBranch,
    credentialMode,
    parserConfig,
  }
}

const mapUpdatePayload = (
  payload: Record<string, unknown>
): UpdateKnowledgeSourcePayload & { status?: KnowledgeSourceStatus } => {
  const connectionConfig = payload.connection_config as
    | Record<string, unknown>
    | undefined
  const metadata = payload.metadata as Record<string, unknown> | undefined
  const parserConfig = parseParserConfig(
    metadata?.parser_config as Record<string, unknown> | undefined
  )

  const updatePayload: UpdateKnowledgeSourcePayload & {
    status?: KnowledgeSourceStatus
  } = {}

  if (typeof payload.name === 'string') {
    updatePayload.name = payload.name.trim()
  }
  if (typeof connectionConfig?.repo_url === 'string') {
    updatePayload.repositoryUrl = connectionConfig.repo_url.trim()
  }
  if (typeof connectionConfig?.default_branch === 'string') {
    updatePayload.defaultBranch = connectionConfig.default_branch.trim()
  }
  if (typeof connectionConfig?.credential_mode === 'string') {
    updatePayload.credentialMode =
      connectionConfig.credential_mode as KnowledgeSource['credentialMode']
  }
  if (parserConfig) {
    updatePayload.parserConfig = parserConfig
  }
  if (typeof payload.is_active === 'boolean') {
    updatePayload.status = payload.is_active ? 'active' : 'disabled'
  }

  return updatePayload
}

export const knowledgeSourceHandlers = [
  http.get('*/api/v1/admin/sources', ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const url = new URL(request.url)

    // 仓库管理页面会显式传递 source_type=code
    const isRepositoryView = url.searchParams.get('source_type') === 'code'

    if (isRepositoryView) {
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
      const size = response.pageSize
      const pages = size > 0 ? Math.max(1, Math.ceil(response.total / size)) : 1
      return HttpResponse.json({
        items: response.items.map(toApiKnowledgeSource),
        total: response.total,
        page: response.page,
        size,
        pages,
      })
    }
  }),

  http.post('*/api/v1/admin/sources', async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const payload = (await request.json()) as Record<string, unknown>
    const mapped = mapCreatePayload(payload)
    if (!mapped) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: '名称、仓库地址、默认分支、凭据模式与解析配置为必填项',
        },
        { status: 400 }
      )
    }

    const entity = createKnowledgeSourceFixture(mapped)
    return HttpResponse.json(toApiKnowledgeSource(entity), { status: 201 })
  }),

  http.patch('*/api/v1/admin/sources/:id', async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const rawPayload = (await request.json()) as Record<string, unknown>
    const payload = mapUpdatePayload(rawPayload)
    const statusOverride = payload.status
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
    if (statusOverride) {
      updated.status = statusOverride
    }
    return HttpResponse.json(toApiKnowledgeSource(updated))
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
    const updatedSource = triggerKnowledgeSourceSyncFixture(
      params.id as Identifier
    )
    if (!updatedSource) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '知识源不存在或已删除' },
        { status: 404 }
      )
    }
    const taskId = updatedSource.lastTaskId ?? `task-${updatedSource.id}`
    return HttpResponse.json({
      source: updatedSource,
      message: '已触发增量同步任务',
      taskId,
      task_id: taskId,
      status: 'queued',
      source_id: updatedSource.id,
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
