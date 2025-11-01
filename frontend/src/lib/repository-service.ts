import { apiClient } from './api-client'
import { API_ENDPOINTS, withQuery } from './api-endpoints'
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

/**
 * 获取仓库列表
 */
export function listRepositories(params?: {
  statuses?: string[]
  search?: string
  page?: number
  pageSize?: number
}) {
  const endpoint = withQuery(
    API_ENDPOINTS.repositories.list,
    params as Record<string, unknown>
  )
  return apiClient<RepositoryListResponse>({ endpoint })
}

/**
 * 获取仓库详情
 */
export function getRepository(id: string) {
  return apiClient<Repository>({
    endpoint: API_ENDPOINTS.repositories.detail(id),
  })
}

/**
 * 验证仓库连接
 */
export function validateRepository(request: ValidateRepositoryRequest) {
  return apiClient<ValidateRepositoryResponse>({
    endpoint: API_ENDPOINTS.repositories.validate,
    method: 'POST',
    body: request,
  })
}

/**
 * 创建仓库
 */
export function createRepository(request: CreateRepositoryRequest) {
  return apiClient<Repository>({
    endpoint: API_ENDPOINTS.repositories.create,
    method: 'POST',
    body: request,
  })
}

/**
 * 更新仓库
 */
export function updateRepository(id: string, request: UpdateRepositoryRequest) {
  return apiClient<Repository>({
    endpoint: API_ENDPOINTS.repositories.update(id),
    method: 'PATCH',
    body: request,
  })
}

/**
 * 删除仓库（软删除）
 */
export function deleteRepository(id: string) {
  return apiClient<void>({
    endpoint: API_ENDPOINTS.repositories.delete(id),
    method: 'DELETE',
  })
}

/**
 * 触发索引
 */
export function triggerIndex(id: string, request: TriggerIndexRequest) {
  return apiClient<TriggerIndexResponse>({
    endpoint: API_ENDPOINTS.repositories.triggerIndex(id),
    method: 'POST',
    body: request,
  })
}
