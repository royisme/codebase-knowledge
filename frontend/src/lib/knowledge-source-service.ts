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
import { API_ENDPOINTS, withQuery } from './api-endpoints'

export type KnowledgeSourceListResponse = PaginatedResponse<KnowledgeSource>

export interface TriggerSyncResponse {
  source: KnowledgeSource
  taskId: Identifier
  message: string
}

export function listKnowledgeSources(params?: KnowledgeSourceListParams) {
  const endpoint = withQuery(
    API_ENDPOINTS.knowledgeSources.list,
    params as Record<string, unknown>
  )
  return apiClient<KnowledgeSourceListResponse>({ endpoint })
}

export function createKnowledgeSource(payload: CreateKnowledgeSourcePayload) {
  return apiClient<KnowledgeSource>({
    endpoint: API_ENDPOINTS.knowledgeSources.create,
    method: 'POST',
    body: payload,
  })
}

export function updateKnowledgeSource(
  id: Identifier,
  payload: UpdateKnowledgeSourcePayload
) {
  return apiClient<KnowledgeSource>({
    endpoint: API_ENDPOINTS.knowledgeSources.update(id),
    method: 'PATCH',
    body: payload,
  })
}

export function deleteKnowledgeSource(id: Identifier) {
  return apiClient<void>({
    endpoint: API_ENDPOINTS.knowledgeSources.delete(id),
    method: 'DELETE',
  })
}

export function triggerKnowledgeSourceSync(id: Identifier) {
  return apiClient<TriggerSyncResponse>({
    endpoint: API_ENDPOINTS.knowledgeSources.sync(id),
    method: 'POST',
  })
}

export function bulkOperationOnKnowledgeSources(payload: BulkOperationPayload) {
  return apiClient<BulkOperationResponse>({
    endpoint: API_ENDPOINTS.knowledgeSources.bulk,
    method: 'POST',
    body: payload,
  })
}
