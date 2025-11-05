import type { Identifier, ISODateString } from './common'
import type { Entity } from './graph-query'

export interface RagEvidence {
  id: string
  index: number  // 对应 [1] [2] [3]
  snippet: string
  repo?: string
  branch?: string
  file_path?: string
  start_line?: number
  end_line?: number
  source_type?: string
  score?: number
  link?: string  // GitHub 链接
}

export interface RagCitation {
  id: Identifier
  label: string
  resourceUri: string
  score: number
}

export interface RagMessage {
  id: Identifier
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: ISODateString
  citations?: RagCitation[]
  entities?: Entity[]
  evidence?: RagEvidence[]  // 新增证据字段
  queryId?: string | null
  status?: 'streaming' | 'completed' | 'error'
  error?: string | null
  metadata?: {
    confidenceScore?: number
    processingTimeMs?: number
    sourcesQueried?: string[]
  }
  nextActions?: string[]
}

export interface RagSession {
  id: Identifier
  repositoryId: Identifier
  title: string
  createdAt: ISODateString
  updatedAt: ISODateString
  participants: Identifier[]
  messages: RagMessage[]
  lastQueryId?: string | null
  quickActions?: string[]
}
