// RAG Console MVP 类型定义
import type { Repository } from '@/types'

export type RetrievalMode = 'graph' | 'vector' | 'hybrid'

// 使用 Repository 类型作为知识源
export type KnowledgeSource = Repository

export interface CodeSnippet {
  repository: string
  path: string
  startLine: number
  endLine: number
  content: string
  language: string
  commitHash?: string
}

export interface QueryMetadata {
  retrievalMode: RetrievalMode
  executionTimeMs: number
  fromCache: boolean
}

export interface QueryResult {
  summary: string
  codeSnippets: CodeSnippet[]
  metadata: QueryMetadata
}

export interface QueryTurn {
  id: string
  question: string
  timestamp: string
  summary: string
  result?: QueryResult
}

export interface QueryParams {
  query: string
  sourceIds: string[]
  mode: RetrievalMode
  maxResults: number
  timeoutSeconds: number
}
