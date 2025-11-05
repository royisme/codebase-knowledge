export type QueueTaskStatus =
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'cancelled'

export interface QueueTask {
  task_id: string
  status: QueueTaskStatus
  progress: number
  message: string
  result?: Record<string, unknown> | null
  error?: string | null
  created_at: string
  started_at?: string | null
  completed_at?: string | null
  metadata?: Record<string, unknown>
}

export interface QueueTaskListResponse {
  tasks: QueueTask[]
  total: number
  page: number
  page_size: number
}
