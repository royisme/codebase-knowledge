import type { Identifier, ISODateString } from './common'

export type KnowledgeSourceStatus = 'active' | 'disabled' | 'syncing' | 'error'

export type RepositoryCredentialMode = 'ssh' | 'https' | 'token'

export interface ParserConfig {
  languages: string[]
  pathAllowList?: string[]
  maxDepth?: number
  enableIncrementalRefresh: boolean
}

export interface KnowledgeSource {
  id: Identifier
  name: string
  description?: string
  repositoryUrl: string
  defaultBranch: string
  credentialMode: RepositoryCredentialMode
  status: KnowledgeSourceStatus
  lastSyncedAt?: ISODateString
  lastTaskId?: Identifier
  parserConfig: ParserConfig
  createdAt?: ISODateString
  updatedAt?: ISODateString
  createdBy?: Identifier | null
  updatedBy?: Identifier | null
}

export interface CreateKnowledgeSourcePayload {
  name: string
  repositoryUrl: string
  defaultBranch: string
  credentialMode: RepositoryCredentialMode
  parserConfig: ParserConfig
}

export interface UpdateKnowledgeSourcePayload {
  name?: string
  repositoryUrl?: string
  defaultBranch?: string
  credentialMode?: RepositoryCredentialMode
  parserConfig?: ParserConfig
  status?: KnowledgeSourceStatus
}

export interface KnowledgeSourceListParams {
  page?: number
  pageSize?: number
  search?: string
  statuses?: KnowledgeSourceStatus[]
}

export interface BulkOperationPayload {
  ids: string[]
  operation: 'enable' | 'disable' | 'sync'
}

export interface BulkOperationResponse {
  updated: string[]
  failed: Array<{
    id: string
    error: string
  }>
  message: string
}
