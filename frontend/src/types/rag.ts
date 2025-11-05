import type { Identifier, ISODateString } from './common'
import type { Entity } from './graph-query'

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
