import { create } from 'zustand'
import type {
  KnowledgeSource,
  QueryTurn,
  QueryResult,
  RetrievalMode,
} from '../types/mvp'
import { executeRagQuery, type RagQueryRequest } from '@/lib/rag-query-service'

const MAX_HISTORY = 10 // LRU 最多保留 10 条查询历史

interface RagConsoleMVPStore {
  // 选中的知识源
  selectedSource: KnowledgeSource | null
  
  // 查询历史（本地，最多 10 条）
  queryHistory: QueryTurn[]
  
  // 当前查询状态
  isLoading: boolean
  error: string | null
  
  // 当前结果
  currentResult: QueryResult | null
  
  // Actions
  selectSource: (source: KnowledgeSource | null) => void
  
  submitQuery: (params: {
    query: string
    mode: RetrievalMode
    maxResults: number
  }) => Promise<void>
  
  addToHistory: (turn: QueryTurn) => void
  
  clearHistory: () => void
  
  setError: (error: string | null) => void
  
  reset: () => void
}

export const useRagConsoleMVP = create<RagConsoleMVPStore>((set, get) => ({
  selectedSource: null,
  queryHistory: [],
  isLoading: false,
  error: null,
  currentResult: null,

  selectSource: (source) => {
    set({ selectedSource: source, error: null })
  },

  submitQuery: async (params) => {
    const { selectedSource } = get()
    
    if (!selectedSource) {
      set({ error: '请先选择知识源' })
      return
    }

    if (!params.query.trim()) {
      set({ error: '问题不能为空' })
      return
    }

    set({ isLoading: true, error: null })

    try {
      // 调用真实 API service
      const request: RagQueryRequest = {
        query: params.query,
        source_ids: [selectedSource.id],
        mode: params.mode,
        max_results: params.maxResults,
        include_evidence: true,
        timeout_seconds: 30,
      }

      const response = await executeRagQuery(request)

      const result: QueryResult = {
        summary: response.answer.summary,
        codeSnippets: response.answer.code_snippets.map((snippet) => ({
          repository: snippet.repository,
          path: snippet.path,
          startLine: snippet.start_line,
          endLine: snippet.end_line,
          content: snippet.content,
          language: snippet.language,
        })),
        metadata: {
          retrievalMode: response.source_metadata.retrieval_mode,
          executionTimeMs: response.source_metadata.execution_time_ms,
          fromCache: response.source_metadata.from_cache,
        },
      }

      // 添加到历史
      const turn: QueryTurn = {
        id: `turn-${Date.now()}`,
        question: params.query,
        timestamp: new Date().toISOString(),
        summary: result.summary,
        result,
      }

      get().addToHistory(turn)

      set({
        currentResult: result,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '查询失败，请稍后重试'
      set({
        isLoading: false,
        error: errorMessage,
        currentResult: null,
      })
    }
  },

  addToHistory: (turn) => {
    set((state) => {
      const newHistory = [turn, ...state.queryHistory].slice(0, MAX_HISTORY)
      return { queryHistory: newHistory }
    })
  },

  clearHistory: () => {
    set({ queryHistory: [] })
  },

  setError: (error) => {
    set({ error })
  },

  reset: () => {
    set({
      selectedSource: null,
      queryHistory: [],
      isLoading: false,
      error: null,
      currentResult: null,
    })
  },
}))
