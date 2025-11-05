/**
 * 代码仓库相关类型定义
 */

export type AuthType = 'none' | 'token'

export type RepositoryStatus =
  | 'pending'
  | 'validating'
  | 'pending_index'
  | 'indexing'
  | 'indexed'
  | 'partial'
  | 'failed'

export interface ConnectionConfig {
  repo_url: string
  branch: string
  auth_type: AuthType
  access_token?: string
  include_patterns?: string[]
  exclude_patterns?: string[]
  max_file_size_kb?: number
}

export interface RepositoryMetadata {
  last_commit_sha?: string
  total_files?: number
  total_functions?: number
  languages?: Record<string, number>
  graph_nodes?: number
  graph_edges?: number
  index_version?: string
}

export interface Repository {
  id: string
  name: string
  description?: string
  source_type: 'code'
  connection_config: ConnectionConfig
  source_metadata?: RepositoryMetadata
  is_active: boolean
  last_synced_at?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface RepositoryListResponse {
  items: Repository[]
  total: number
  page: number
  size: number
  pages: number
}

export interface ValidateRepositoryRequest {
  repo_url: string
  auth_type: AuthType
  access_token?: string
}

export interface ValidateRepositoryResponse {
  valid: boolean
  message?: string
  accessible_branches?: string[]
}

export interface CreateRepositoryRequest {
  name: string
  description?: string
  source_type: 'code'
  connection_config: ConnectionConfig
}

export interface UpdateRepositoryRequest {
  name?: string
  description?: string
  connection_config?: Partial<ConnectionConfig>
  is_active?: boolean
}

export interface TriggerIndexRequest {
  force_full?: boolean
}

export interface TriggerIndexResponse {
  message: string
  job_id?: string
  task_id?: string
  status?: string
  source_id?: string
  source_name?: string
}
