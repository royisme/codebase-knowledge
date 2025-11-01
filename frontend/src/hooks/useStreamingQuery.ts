/**
 * 流式查询 Hook
 *
 * 用于知识图谱查询的流式传输，支持 SSE 事件处理和状态管理
 */
import { useState, useCallback, useRef } from 'react'
import type {
  StreamEvent,
  StreamQueryParams,
  StreamQueryState,
  StreamEventHandlers,
} from '@/types/streaming'
import { useAuthStore } from '@/stores/auth-store'
import { parseSSE } from '@/lib/sse-parser'
import { API_ENDPOINTS } from '@/lib/api-endpoints'

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim()
const BASE_URL =
  RAW_BASE_URL && RAW_BASE_URL.length > 0
    ? RAW_BASE_URL
    : 'http://localhost:8000'

/**
 * 流式查询 Hook
 *
 * @example
 * ```tsx
 * const { text, entities, isStreaming, query, abort } = useStreamingQuery()
 *
 * const handleSubmit = () => {
 *   query({
 *     question: 'How does authentication work?',
 *     source_ids: ['repo-1'],
 *   })
 * }
 * ```
 */
export function useStreamingQuery(handlers?: StreamEventHandlers) {
  const [state, setState] = useState<StreamQueryState>({
    text: '',
    entities: [],
    metadata: null,
    isStreaming: false,
    error: null,
    queryId: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * 处理流式事件
   */
  const handleStreamEvent = useCallback(
    (event: StreamEvent) => {
      switch (event.type) {
        case 'text':
          setState((prev) => ({
            ...prev,
            text: prev.text + event.content,
          }))
          handlers?.onText?.(event.content)
          break

        case 'entity':
          setState((prev) => ({
            ...prev,
            entities: [...prev.entities, event.entity],
          }))
          handlers?.onEntity?.(event.entity)
          break

        case 'metadata':
          setState((prev) => ({
            ...prev,
            metadata: event.data,
          }))
          handlers?.onMetadata?.(event.data)
          break

        case 'done':
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            queryId: event.query_id,
          }))
          handlers?.onDone?.(event.query_id)
          break

        case 'error':
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            error: event.message,
          }))
          handlers?.onError?.(event.message)
          break

        default:
          // Unknown event type - silently ignore
          break
      }
    },
    [handlers]
  )

  /**
   * 执行流式查询
   */
  const query = useCallback(
    async (params: StreamQueryParams) => {
      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // 重置状态
      setState({
        text: '',
        entities: [],
        metadata: null,
        isStreaming: true,
        error: null,
        queryId: null,
      })

      // 创建新的 AbortController
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const token = useAuthStore.getState().auth.token?.accessToken

        // 使用与 apiClient 相同的 URL 构造逻辑，避免路径重复
        const endpoint = API_ENDPOINTS.rag.stream
        const url = new URL(endpoint, BASE_URL).toString()

        const headers = new Headers({
          'Content-Type': 'application/json',
        })

        if (token) {
          headers.set('Authorization', `Bearer ${token}`)
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(params),
          credentials: 'include', // 与 apiClient 保持一致
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.detail ||
              `HTTP ${response.status}: ${response.statusText}`
          )
        }

        if (!response.body) {
          throw new Error('Response body is null')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const { parsed, remaining } = parseSSE(buffer)

          for (const event of parsed) {
            handleStreamEvent(event)
          }

          buffer = remaining
        }

        // 处理剩余的缓冲区
        if (buffer.trim()) {
          const { parsed } = parseSSE(buffer + '\n\n')
          for (const event of parsed) {
            handleStreamEvent(event)
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          // 忽略用户主动取消的错误
          if (error.name === 'AbortError') {
            setState((prev) => ({
              ...prev,
              isStreaming: false,
            }))
            return
          }

          setState((prev) => ({
            ...prev,
            isStreaming: false,
            error: error.message,
          }))
          handlers?.onError?.(error.message)
        } else {
          const message = 'Unknown error occurred'
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            error: message,
          }))
          handlers?.onError?.(message)
        }
      }
    },
    [handleStreamEvent, handlers]
  )

  /**
   * 中止当前查询
   */
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    abort()
    setState({
      text: '',
      entities: [],
      metadata: null,
      isStreaming: false,
      error: null,
      queryId: null,
    })
  }, [abort])

  return {
    ...state,
    query,
    abort,
    reset,
  }
}

/**
 * 辅助函数：从状态构建完整的查询响应对象
 */
export function buildQueryResponse(state: StreamQueryState) {
  return {
    answer: {
      summary: state.text,
      related_entities: state.entities,
      evidence: [],
      next_actions: [],
    },
    confidence_score: state.metadata?.confidence_score || 0,
    evidence_anchors: [],
    sources_queried: state.metadata?.sources_queried || [],
    processing_time_ms: state.metadata?.execution_time_ms || 0,
    query_id: state.queryId || undefined,
  }
}
