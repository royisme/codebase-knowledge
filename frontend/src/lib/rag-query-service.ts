/**
 * RAG 查询 API Service
 */
import type { RetrievalMode } from '@/features/rag-console/types'
import { apiClient } from './api-client'
import { API_ENDPOINTS } from './api-endpoints'

// ==================== 请求类型 ====================

export interface RagQueryRequest {
  query: string
  source_ids: string[]
  mode: RetrievalMode
  max_results: number
  include_evidence?: boolean
  timeout_seconds?: number
}

// ==================== 响应类型 ====================

export interface CodeSnippet {
  repository: string
  path: string
  start_line: number
  end_line: number
  content: string
  language: string
  commit_hash?: string
}

export interface QueryMetadata {
  retrieval_mode: RetrievalMode
  execution_time_ms: number
  from_cache: boolean
  source_count?: number
  snippet_count?: number
}

export interface RagQueryResponse {
  answer: {
    summary: string
    code_snippets: CodeSnippet[]
  }
  source_metadata: QueryMetadata
}

// ==================== API 函数 ====================

/**
 * 执行 RAG 查询
 */
export function executeRagQuery(request: RagQueryRequest) {
  return apiClient<RagQueryResponse>({
    endpoint: API_ENDPOINTS.rag.query,
    method: 'POST',
    body: request,
  })
}

/**
 * 获取查询历史
 */
export function getQueryHistory(params?: {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
}) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize))
  if (params?.startDate) searchParams.set('startDate', params.startDate)
  if (params?.endDate) searchParams.set('endDate', params.endDate)

  const query = searchParams.toString()
  const endpoint = query
    ? `${API_ENDPOINTS.rag.queryHistory}?${query}`
    : API_ENDPOINTS.rag.queryHistory

  interface QueryHistoryItem {
    id: string
    query: string
    timestamp: string
    result?: RagQueryResponse
  }

  interface QueryHistoryResponse {
    items: QueryHistoryItem[]
    total: number
    page: number
    pageSize: number
  }

  return apiClient<QueryHistoryResponse>({ endpoint })
}

/**
 * 获取单个查询详情
 */
export function getQueryDetail(queryId: string) {
  return apiClient<RagQueryResponse>({
    endpoint: API_ENDPOINTS.rag.queryDetail(queryId),
  })
}
