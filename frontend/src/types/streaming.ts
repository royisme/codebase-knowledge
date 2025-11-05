/**
 * 流式传输事件类型定义
 *
 * 用于知识图谱查询的 Server-Sent Events (SSE) 协议
 */
import type { Entity } from './graph-query'
import type { RagEvidence } from './rag'

/**
 * 流式事件类型枚举
 */
export type StreamEventType =
  | 'text_delta'
  | 'text'
  | 'status'
  | 'entity'
  | 'evidence'
  | 'metadata'
  | 'done'
  | 'error'

/**
 * 文本增量事件（Token级别）
 * 用于传输 LLM 生成的答案文本片段（真正的 streaming）
 */
export interface TextDeltaEvent {
  type: 'text_delta'
  content: string
}

/**
 * 文本块事件（向后兼容）
 * 用于传输 LLM 生成的答案文本片段
 */
export interface TextEvent {
  type: 'text'
  content: string
  delta?: boolean // 是否为增量文本（默认 true）
}

/**
 * 状态事件
 * 用于传输查询阶段状态
 */
export interface StatusEvent {
  type: 'status'
  stage: string // 'context' | 'llm' | 'finalizing'
  message: string
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
 * 证据事件
 * 用于传输可回溯的代码证据
 */
export interface EvidenceEvent {
  type: 'evidence'
  evidence: RagEvidence
}

/**
 * 元数据事件
 * 包含查询执行的统计信息
 */
export interface MetadataEvent {
  type: 'metadata'
  data?: {
    execution_time_ms: number
    sources_queried: string[]
    confidence_score?: number
    retrieval_mode?: string
    from_cache?: boolean
  }
  // 支持扁平化字段（新格式）
  confidence_score?: number
  execution_time_ms?: number
  sources_queried?: string[]
  retrieval_mode?: string
}

/**
 * 完成事件
 * 标记流式传输结束
 */
export interface DoneEvent {
  type: 'done'
  query_id: string
  timestamp?: string
  summary?: string
  next_actions?: string[]
  confidence_score?: number
  sources_queried?: string[]
  processing_time_ms?: number
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
  processing_time_ms?: number
}

/**
 * 流式事件联合类型
 */
export type StreamEvent =
  | TextDeltaEvent
  | TextEvent
  | StatusEvent
  | EntityEvent
  | EvidenceEvent
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
  nextActions: string[]
  confidenceScore?: number
  sourcesQueried: string[]
  processingTimeMs?: number
}

/**
 * 流式事件处理器类型
 */
export interface StreamEventHandlers {
  onText?: (content: string) => void
  onEntity?: (entity: Entity) => void
  onEvidence?: (evidence: RagEvidence) => void
  onMetadata?: (metadata: MetadataEvent['data']) => void
  onDone?: (event: DoneEvent) => void
  onError?: (error: ErrorEvent) => void
}
