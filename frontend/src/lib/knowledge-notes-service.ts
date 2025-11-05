import type { Identifier } from '@/types'
import { apiClient } from './api-client'
import { API_ENDPOINTS } from './api-endpoints'

type ApiKnowledgeNote = {
  id: string
  source_id: string | null
  question: string
  answer_summary: string
  code_snippets?: Record<string, unknown> | null
  tags?: Record<string, unknown> | null
  note?: string | null
  created_at: string
  updated_at: string
}

type ApiKnowledgeNotePayload = {
  source_id?: string | null
  question: string
  answer_summary: string
  code_snippets?: Record<string, unknown> | null
  tags?: Record<string, unknown> | null
  note?: string | null
}

export interface KnowledgeNoteDTO {
  id: Identifier
  sourceId: string | null
  question: string
  answerSummary: string
  createdAt: string
  updatedAt: string
  codeSnippets?: Record<string, unknown> | null
  tags?: string[]
  note?: string | null
}

const mapApiNoteToDto = (item: ApiKnowledgeNote): KnowledgeNoteDTO => ({
  id: item.id,
  sourceId: item.source_id,
  question: item.question,
  answerSummary: item.answer_summary,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  codeSnippets: item.code_snippets ?? null,
  tags: item.tags ? Object.keys(item.tags) : undefined,
  note: item.note ?? null,
})

const mapFormToApiPayload = (payload: {
  sourceId?: string | null
  question: string
  answerSummary: string
  codeSnippets?: Record<string, unknown> | null
  tags?: string[]
  note?: string | null
}): ApiKnowledgeNotePayload => ({
  source_id: payload.sourceId ?? null,
  question: payload.question,
  answer_summary: payload.answerSummary,
  code_snippets: payload.codeSnippets ?? null,
  tags: payload.tags
    ? payload.tags.reduce<Record<string, boolean>>((acc, tag) => {
        acc[tag] = true
        return acc
      }, {})
    : null,
  note: payload.note ?? null,
})

export async function listKnowledgeNotes(): Promise<KnowledgeNoteDTO[]> {
  const data = await apiClient<ApiKnowledgeNote[]>({
    endpoint: API_ENDPOINTS.knowledge.notes,
  })
  return data.map(mapApiNoteToDto)
}

export async function upsertKnowledgeNote(payload: {
  sourceId?: string | null
  question: string
  answerSummary: string
  codeSnippets?: Record<string, unknown> | null
  tags?: string[]
  note?: string | null
}): Promise<Identifier> {
  const { id } = await apiClient<{ id: Identifier }>({
    endpoint: API_ENDPOINTS.knowledge.notes,
    method: 'POST',
    body: mapFormToApiPayload(payload),
  })
  return id
}

export async function deleteKnowledgeNote(id: Identifier): Promise<void> {
  await apiClient<void>({
    endpoint: API_ENDPOINTS.knowledge.noteDetail(String(id)),
    method: 'DELETE',
  })
}
