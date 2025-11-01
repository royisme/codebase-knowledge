import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KnowledgeNote {
  id: string;
  question: string;
  answer: string;
  sourceId: string;
  sourceName: string;
  createdAt: string;
  tags?: string[];
}

export interface QueryHistory {
  id: string;
  question: string;
  sourceId: string;
  sourceName: string;
  answer: string;
  timestamp: string;
  executionTimeMs: number;
}

interface KnowledgeNoteStore {
  notes: KnowledgeNote[];
  history: QueryHistory[];
  
  addNote: (note: Omit<KnowledgeNote, 'id' | 'createdAt'>) => void;
  removeNote: (id: string) => void;
  clearNotes: () => void;
  
  addToHistory: (query: Omit<QueryHistory, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  
  getNotesCount: () => number;
  getHistoryCount: () => number;
}

export const useKnowledgeNoteStore = create<KnowledgeNoteStore>()(
  persist(
    (set, get) => ({
      notes: [],
      history: [],

      addNote: (note) => {
        const newNote: KnowledgeNote = {
          ...note,
          id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          notes: [newNote, ...state.notes],
        }));
      },

      removeNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }));
      },

      clearNotes: () => {
        set({ notes: [] });
      },

      addToHistory: (query) => {
        const newQuery: QueryHistory = {
          ...query,
          id: `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          history: [newQuery, ...state.history].slice(0, 100), // 只保留最近100条
        }));
      },

      clearHistory: () => {
        set({ history: [] });
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
);
