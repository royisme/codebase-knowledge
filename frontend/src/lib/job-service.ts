import type { Job, JobListResponse } from '@/types/job'
import { apiClient } from './api-client'
import { API_ENDPOINTS, withQuery } from './api-endpoints'

type SourceJobListResponse = {
  items: Job[]
  total: number
  page: number
  size: number
  pages: number
}

export async function listJobs(params: {
  sourceId: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<JobListResponse> {
  const { sourceId, status, page = 1, pageSize = 20 } = params
  const endpoint = withQuery(API_ENDPOINTS.jobs.listBySource(sourceId), {
    page,
    size: pageSize,
    status,
  })
  const response = await apiClient<SourceJobListResponse>({ endpoint })
  return {
    items: response.items,
    total: response.total,
    page: response.page,
    pageSize: response.size,
  }
}

export function getJobDetail(id: string) {
  return apiClient<Job>({
    endpoint: API_ENDPOINTS.jobs.detail(id),
  })
}

export async function cancelJob(jobId: string): Promise<{ message: string; job_id: string; status: string }> {
  return apiClient({
    endpoint: API_ENDPOINTS.jobs.cancel(jobId),
    method: 'POST',
  })
}

export async function deleteJob(jobId: string): Promise<void> {
  return apiClient({
    endpoint: API_ENDPOINTS.jobs.delete(jobId),
    method: 'DELETE',
  })
}

export async function retryJob(jobId: string): Promise<{ message: string; job_id: string; task_id: string; status: string }> {
  return apiClient({
    endpoint: API_ENDPOINTS.jobs.retry(jobId),
    method: 'POST',
  })
}
