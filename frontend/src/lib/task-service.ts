import type { QueueTask, QueueTaskListResponse } from '@/types/tasks'
import { apiClient } from './api-client'
import { API_ENDPOINTS, withQuery } from './api-endpoints'

export function listTasks(params?: {
  status?: string
  page?: number
  pageSize?: number
  taskType?: string
}) {
  const endpoint = withQuery(API_ENDPOINTS.tasks.list, {
    status: params?.status,
    page: params?.page ?? 1,
    page_size: params?.pageSize ?? 20,
    task_type: params?.taskType,
  })
  return apiClient<QueueTaskListResponse>({ endpoint })
}

export function getTask(taskId: string) {
  return apiClient<QueueTask>({
    endpoint: API_ENDPOINTS.tasks.detail(taskId),
  })
}
