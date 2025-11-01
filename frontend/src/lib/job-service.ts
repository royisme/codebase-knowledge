import { apiClient } from './api-client'
import { API_ENDPOINTS, withQuery } from './api-endpoints'
import type { JobListResponse, JobDetailResponse } from '@/types/job'

/**
 * 获取任务列表
 */
export function listJobs(params?: {
  source_id?: string
  status?: string
  page?: number
  pageSize?: number
}) {
  const endpoint = withQuery(
    API_ENDPOINTS.jobs.list,
    params as Record<string, unknown>
  )
  return apiClient<JobListResponse>({ endpoint })
}

/**
 * 获取任务详情
 */
export function getJobDetail(id: string) {
  return apiClient<JobDetailResponse>({
    endpoint: API_ENDPOINTS.jobs.detail(id),
  })
}

/**
 * 取消任务
 */
export function cancelJob(id: string) {
  return apiClient<void>({
    endpoint: API_ENDPOINTS.jobs.cancel(id),
    method: 'POST',
  })
}

/**
 * 重试任务
 */
export function retryJob(id: string) {
  return apiClient<void>({
    endpoint: API_ENDPOINTS.jobs.retry(id),
    method: 'POST',
  })
}
