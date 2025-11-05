import type {
  Repository,
  RepositoryListResponse,
  ValidateRepositoryRequest,
  ValidateRepositoryResponse,
  CreateRepositoryRequest,
  UpdateRepositoryRequest,
  TriggerIndexRequest,
  TriggerIndexResponse,
} from '@/types/repository'
import { apiClient } from './api-client'
import { API_ENDPOINTS, withQuery } from './api-endpoints'

export function listRepositories(params?: {
  statuses?: string[]
  search?: string
  page?: number
  pageSize?: number
}) {
  const queryParams: Record<string, unknown> = {
    source_type: 'code',
  }
  if (params?.statuses) queryParams.statuses = params.statuses
  if (params?.search) queryParams.search = params.search
  if (params?.page) queryParams.page = params.page
  if (params?.pageSize) queryParams.size = params.pageSize

  const endpoint = withQuery(API_ENDPOINTS.repositories.list, queryParams)
  return apiClient<RepositoryListResponse>({ endpoint })
}

export function getRepository(id: string) {
  return apiClient<Repository>({
    endpoint: API_ENDPOINTS.repositories.detail(id),
  })
}

export function validateRepository(request: ValidateRepositoryRequest) {
  return apiClient<ValidateRepositoryResponse>({
    endpoint: API_ENDPOINTS.repositories.validate,
    method: 'POST',
    body: request,
  })
}

export function createRepository(request: CreateRepositoryRequest) {
  return apiClient<Repository>({
    endpoint: API_ENDPOINTS.repositories.create,
    method: 'POST',
    body: request,
  })
}

export function updateRepository(id: string, request: UpdateRepositoryRequest) {
  return apiClient<Repository>({
    endpoint: API_ENDPOINTS.repositories.update(id),
    method: 'PATCH',
    body: request,
  })
}

export function deleteRepository(id: string) {
  return apiClient<void>({
    endpoint: API_ENDPOINTS.repositories.delete(id),
    method: 'DELETE',
  })
}

export function triggerIndex(id: string, request: TriggerIndexRequest) {
  return apiClient<TriggerIndexResponse>({
    endpoint: API_ENDPOINTS.repositories.triggerSync(id),
    method: 'POST',
    body: request.force_full ? { sync_config: { force_full: true } } : {},
  })
}
