import type {
  CreateKnowledgeSourcePayload,
  Identifier,
  KnowledgeSource,
  KnowledgeSourceListParams,
  UpdateKnowledgeSourcePayload,
} from '@/types'
import { apiClient } from './api-client'
import { API_ENDPOINTS, withQuery } from './api-endpoints'

interface ApiKnowledgeSource {
  id: string
  name: string
  description?: string | null
  source_type: string
  connection_config?: Record<string, unknown> | null
  source_metadata?: Record<string, unknown> | null
  is_active: boolean
  sync_frequency_minutes?: number | null
  last_synced_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

interface ApiKnowledgeSourceListResponse {
  items: ApiKnowledgeSource[]
  total: number
  page: number
  size: number
  pages: number
}

const DEFAULT_LANGUAGES = ['python', 'typescript']

const normalizeArray = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

const mapApiToKnowledgeSource = (item: ApiKnowledgeSource): KnowledgeSource => {
  const connectionConfig = (item.connection_config ?? {}) as Record<
    string,
    unknown
  >
  const metadata = (item.source_metadata ?? {}) as Record<string, unknown>
  const parserConfig = (metadata.parser_config ?? {}) as Record<string, unknown>

  const languages = normalizeArray(parserConfig.languages ?? DEFAULT_LANGUAGES)
  const pathAllowList = normalizeArray(parserConfig.path_allow_list)
  const maxDepthValue = parserConfig.max_depth

  return {
    id: item.id,
    name: item.name,
    description: item.description ?? undefined,
    repositoryUrl: String(connectionConfig.repo_url ?? ''),
    defaultBranch: String(connectionConfig.default_branch ?? 'main'),
    credentialMode: (connectionConfig.credential_mode ?? 'ssh') as
      | 'ssh'
      | 'https'
      | 'token',
    status: item.is_active ? 'active' : 'disabled',
    lastSyncedAt: item.last_synced_at ?? undefined,
    lastTaskId: undefined,
    parserConfig: {
      languages: languages.length > 0 ? languages : DEFAULT_LANGUAGES,
      pathAllowList: pathAllowList.length > 0 ? pathAllowList : undefined,
      maxDepth: typeof maxDepthValue === 'number' ? maxDepthValue : undefined,
      enableIncrementalRefresh:
        typeof parserConfig.enable_incremental_refresh === 'boolean'
          ? parserConfig.enable_incremental_refresh
          : true,
    },
    createdAt: item.created_at ?? undefined,
    updatedAt: item.updated_at ?? undefined,
    createdBy: item.created_by ?? undefined,
    updatedBy: item.updated_by ?? undefined,
  }
}

const buildCreatePayload = (
  payload: CreateKnowledgeSourcePayload
): Record<string, unknown> => {
  const languages = payload.parserConfig.languages.length
    ? payload.parserConfig.languages
    : DEFAULT_LANGUAGES

  return {
    name: payload.name,
    description: null,
    source_type: 'code',
    connection_config: {
      repo_url: payload.repositoryUrl,
      default_branch: payload.defaultBranch,
      credential_mode: payload.credentialMode,
    },
    metadata: {
      parser_config: {
        languages,
        path_allow_list: payload.parserConfig.pathAllowList,
        max_depth: payload.parserConfig.maxDepth,
        enable_incremental_refresh:
          payload.parserConfig.enableIncrementalRefresh,
      },
    },
    is_active: true,
  }
}

const buildUpdatePayload = (
  payload: Partial<CreateKnowledgeSourcePayload> &
    UpdateKnowledgeSourcePayload & { status?: KnowledgeSource['status'] }
): Record<string, unknown> => {
  const body: Record<string, unknown> = {}

  if (payload.name) body.name = payload.name
  if (
    payload.repositoryUrl ||
    payload.defaultBranch ||
    payload.credentialMode
  ) {
    body.connection_config = {
      ...(payload.repositoryUrl ? { repo_url: payload.repositoryUrl } : {}),
      ...(payload.defaultBranch
        ? { default_branch: payload.defaultBranch }
        : {}),
      ...(payload.credentialMode
        ? { credential_mode: payload.credentialMode }
        : {}),
    }
  }
  if (payload.parserConfig) {
    body.metadata = {
      parser_config: {
        languages: payload.parserConfig.languages,
        path_allow_list: payload.parserConfig.pathAllowList,
        max_depth: payload.parserConfig.maxDepth,
        enable_incremental_refresh:
          payload.parserConfig.enableIncrementalRefresh,
      },
    }
  }
  if (typeof payload.status !== 'undefined') {
    body.is_active = payload.status === 'active'
  }
  return body
}

export async function listKnowledgeSources(
  params?: KnowledgeSourceListParams
): Promise<{
  items: KnowledgeSource[]
  total: number
  page: number
  pageSize: number
}> {
  const queryParams: Record<string, unknown> = {}
  if (params?.page) queryParams.page = params.page
  if (params?.pageSize) queryParams.size = params.pageSize
  if (params?.search) queryParams.search = params.search
  if (params?.statuses?.length) {
    if (
      params.statuses.includes('active') &&
      !params.statuses.includes('disabled')
    ) {
      queryParams.is_active = true
    } else if (
      params.statuses.includes('disabled') &&
      !params.statuses.includes('active')
    ) {
      queryParams.is_active = false
    }
  }

  const endpoint = withQuery(API_ENDPOINTS.knowledgeSources.list, queryParams)
  const response = await apiClient<ApiKnowledgeSourceListResponse>({ endpoint })

  return {
    items: response.items.map(mapApiToKnowledgeSource),
    total: response.total,
    page: response.page,
    pageSize: params?.pageSize ?? response.size,
  }
}

export async function createKnowledgeSource(
  payload: CreateKnowledgeSourcePayload
) {
  const response = await apiClient<ApiKnowledgeSource>({
    endpoint: API_ENDPOINTS.knowledgeSources.create,
    method: 'POST',
    body: buildCreatePayload(payload),
  })
  return mapApiToKnowledgeSource(response)
}

export async function updateKnowledgeSource(
  id: Identifier,
  payload: UpdateKnowledgeSourcePayload & { status?: KnowledgeSource['status'] }
) {
  const response = await apiClient<ApiKnowledgeSource>({
    endpoint: API_ENDPOINTS.knowledgeSources.update(id),
    method: 'PATCH',
    body: buildUpdatePayload(payload),
  })
  return mapApiToKnowledgeSource(response)
}

export async function deleteKnowledgeSource(id: Identifier) {
  await apiClient<void>({
    endpoint: API_ENDPOINTS.knowledgeSources.delete(id),
    method: 'DELETE',
  })
}

export async function triggerKnowledgeSourceSync(id: Identifier) {
  return apiClient<{
    message: string
    job_id?: string
    task_id?: string
    status?: string
  }>({
    endpoint: API_ENDPOINTS.knowledgeSources.sync(id),
    method: 'POST',
  })
}
