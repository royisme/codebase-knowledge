import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface KnowledgeNote {
  id: string
  question: string
  answerSummary: string
  sourceId: string | null
  sourceName?: string
  createdAt: string
  updatedAt: string
  tags?: string[]
  note?: string | null
}

export interface QueryHistory {
  id: string
  question: string
  sourceId: string
  sourceName: string
  answer: string
  timestamp: string
  executionTimeMs: number
}

interface KnowledgeNoteStore {
  notes: KnowledgeNote[]
  history: QueryHistory[]

  setNotes: (items: KnowledgeNote[]) => void
  addNote: (note: KnowledgeNote) => void
  removeNote: (id: string) => void
  clearNotes: () => void

  addToHistory: (query: Omit<QueryHistory, 'id' | 'timestamp'>) => void
  clearHistory: () => void

  getNotesCount: () => number
  getHistoryCount: () => number
}

export const useKnowledgeNoteStore = create<KnowledgeNoteStore>()(
  persist(
    (set, get) => ({
      notes: [],
      history: [],

      setNotes: (items) => {
        set({ notes: items })
      },

      addNote: (note) => {
        set((state) => ({
          notes: [note, ...state.notes.filter((item) => item.id !== note.id)],
        }))
      },

      removeNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }))
      },

      clearNotes: () => {
        set({ notes: [] })
      },

      addToHistory: (query) => {
        const newQuery: QueryHistory = {
          ...query,
          id: `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        }
        set((state) => ({
          history: [newQuery, ...state.history].slice(0, 100),
        }))
      },

      clearHistory: () => {
        set({ history: [] })
      },

      getNotesCount: () => get().notes.length,
      getHistoryCount: () => get().history.length,
    }),
    {
      name: 'knowledge-note-storage',
      partialize: (state) => ({
        notes: state.notes,
        history: state.history,
      }),
    }
  )
)
