import type {
  BulkOperationPayload,
  BulkOperationResponse,
  CreateKnowledgeSourcePayload,
  Identifier,
  KnowledgeSource,
  KnowledgeSourceListParams,
  PaginatedResponse,
  UpdateKnowledgeSourcePayload,
} from '@/types'

import { apiClient } from './api-client'

export type KnowledgeSourceListResponse = PaginatedResponse<KnowledgeSource>

export interface TriggerSyncResponse {
  source: KnowledgeSource
  taskId: Identifier
  message: string
}

function buildQuery(params?: KnowledgeSourceListParams) {
  const searchParams = new URLSearchParams()

  if (!params) return ''

  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
  if (params.search && params.search.trim().length > 0) {
    searchParams.set('search', params.search.trim())
  }
  params.statuses?.forEach((status) => {
    searchParams.append('status', status)
  })

  const query = searchParams.toString()
  return query.length > 0 ? `?${query}` : ''
}

export function listKnowledgeSources(params?: KnowledgeSourceListParams) {
  const query = buildQuery(params)
  return apiClient<KnowledgeSourceListResponse>({
    endpoint: `/api/admin/sources${query}`,
  })
}

export function createKnowledgeSource(payload: CreateKnowledgeSourcePayload) {
  return apiClient<KnowledgeSource>({
    endpoint: '/api/admin/sources',
    method: 'POST',
    body: payload,
  })
}

export function updateKnowledgeSource(
  id: Identifier,
  payload: UpdateKnowledgeSourcePayload
) {
  return apiClient<KnowledgeSource>({
    endpoint: `/api/admin/sources/${id}`,
    method: 'PATCH',
    body: payload,
  })
}

export function deleteKnowledgeSource(id: Identifier) {
  return apiClient<void>({
    endpoint: `/api/admin/sources/${id}`,
    method: 'DELETE',
  })
}

export function triggerKnowledgeSourceSync(id: Identifier) {
  return apiClient<TriggerSyncResponse>({
    endpoint: `/api/admin/sources/${id}/sync`,
    method: 'POST',
  })
}

export function bulkOperationOnKnowledgeSources(payload: BulkOperationPayload) {
  return apiClient<BulkOperationResponse>({
    endpoint: '/api/admin/sources/bulk',
    method: 'POST',
    body: payload,
  })
}
