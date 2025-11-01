/**
 * 索引任务相关类型定义
 */

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export type JobStage =
  | 'git_clone'
  | 'file_scan'
  | 'code_parse'
  | 'embedding'
  | 'graph_build'
  | 'completed'

export interface JobConfig {
  stage: JobStage
  retry_count: number
  max_retries: number
  timeout_seconds: number
}

export interface JobResultSummary {
  files_scanned?: number
  files_parsed?: number
  files_failed?: number
  functions_extracted?: number
  imports_extracted?: number
  nodes_created?: number
  edges_created?: number
  duration_seconds?: number
  errors?: Array<{
    file: string
    error: string
  }>
}

export interface Job {
  id: string
  source_id: string
  status: JobStatus
  started_at?: string
  completed_at?: string
  error_message?: string
  progress_percentage: number
  items_processed: number
  total_items?: number
  job_config?: JobConfig
  result_summary?: JobResultSummary
  created_at: string
  updated_at: string
}

export interface JobListResponse {
  items: Job[]
  total: number
  page: number
  pageSize: number
}

export interface JobLog {
  timestamp: string
  level: 'info' | 'warning' | 'error'
  message: string
  stage: JobStage
}

export interface JobDetailResponse extends Job {
  logs: JobLog[]
}
