/**
 * 流式传输事件类型定义
 *
 * 用于知识图谱查询的 Server-Sent Events (SSE) 协议
 */

import type { Entity } from './graph-query'

/**
 * 流式事件类型枚举
 */
export type StreamEventType = 'text' | 'entity' | 'metadata' | 'done' | 'error'

/**
 * 文本块事件
 * 用于传输 LLM 生成的答案文本片段
 */
export interface TextEvent {
  type: 'text'
  content: string
  delta?: boolean  // 是否为增量文本（默认 true）
}

/**
 * 实体事件
 * 用于传输关联实体（文件、提交、模块等）
 */
export interface EntityEvent {
  type: 'entity'
  entity: Entity
}

/**
 * 元数据事件
 * 包含查询执行的统计信息
 */
export interface MetadataEvent {
  type: 'metadata'
  data: {
    execution_time_ms: number
    sources_queried: string[]
    confidence_score?: number
    retrieval_mode?: string
    from_cache?: boolean
  }
}

/**
 * 完成事件
 * 标记流式传输结束
 */
export interface DoneEvent {
  type: 'done'
  query_id: string
  timestamp?: string
}

/**
 * 错误事件
 * 流式传输过程中的错误
 */
export interface ErrorEvent {
  type: 'error'
  message: string
  code?: string
  details?: unknown
}

/**
 * 流式事件联合类型
 */
export type StreamEvent =
  | TextEvent
  | EntityEvent
  | MetadataEvent
  | DoneEvent
  | ErrorEvent

/**
 * SSE 解析结果
 */
export interface SSEParseResult {
  parsed: StreamEvent[]
  remaining: string
}

/**
 * 流式查询参数
 */
export interface StreamQueryParams {
  question: string
  source_ids: string[]
  retrieval_mode?: 'graph' | 'vector' | 'hybrid'
  top_k?: number
  timeout?: number
  session_id?: string
}

/**
 * 流式查询状态
 */
export interface StreamQueryState {
  text: string
  entities: Entity[]
  metadata: MetadataEvent['data'] | null
  isStreaming: boolean
  error: string | null
  queryId: string | null
}

/**
 * 流式事件处理器类型
 */
export interface StreamEventHandlers {
  onText?: (content: string) => void
  onEntity?: (entity: Entity) => void
  onMetadata?: (metadata: MetadataEvent['data']) => void
  onDone?: (queryId: string) => void
  onError?: (error: string) => void
}
