// GraphRAG Query Types
export interface GraphRAGResponse {
  answer: {
    summary: string
    related_entities: Entity[]
    evidence: Evidence[]
    next_actions: string[]
  }
  confidence_score: number
  evidence_anchors: EvidenceAnchor[]
  raw_messages?: unknown[] | null
  sources_queried: string[]
  processing_time_ms: number
  query_id?: string
  issues?: string[]
}

export interface Entity {
  type: 'file' | 'commit' | 'module' | 'person'
  name: string
  importance: 'high' | 'medium' | 'low'
  detail: string
  link?: string
  author?: string
}

export interface Evidence {
  id: string
  snippet: string
  source_type: 'commit' | 'file' | 'doc'
  source_ref: string
  score?: number
}

export interface EvidenceAnchor {
  source_id: string
  source_name: string
  content_snippet: string
  relevance_score: number
  page_number?: number | null
  section_title?: string | null
}

// Enhanced ChatMessage with GraphRAG-specific data
export interface GraphChatMessage {
  id: string
  role: 'user' | 'assistant'
  parts: Array<{ type: 'text'; text: string }>
  timestamp: Date
  entities?: Entity[] // 仅 assistant 消息包含
  evidence?: Evidence[] // 仅 assistant 消息包含
  actions?: string[] // 仅 assistant 消息包含
}

// Query state management
export interface GraphQueryState {
  messages: GraphChatMessage[]
  currentQuery: GraphRAGResponse | null
  isLoading: boolean
  error: string | null
}
