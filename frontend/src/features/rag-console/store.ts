import type { Identifier, ISODateString, RagMessage, RagSession } from '@/types'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ragFixtures } from '@/lib/api-mock/fixtures/rag'

type SessionIdentifier = RagSession['id']

interface RagChatState {
  sessions: RagSession[]
  selectedSessionId: SessionIdentifier | null
  lastQueryIds: Record<SessionIdentifier, string | null>
  isLoading: boolean
  error: string | null
  pendingMessage: string | null
  pendingSessionId: SessionIdentifier | null
  selectSession: (sessionId: SessionIdentifier) => void
  queueUserMessage: (
    content: string
  ) => { sessionId: SessionIdentifier; message: RagMessage } | null
  completeAssistantMessage: (input: {
    sessionId: SessionIdentifier
    message: RagMessage
    lastQueryId?: string | null
  }) => void
  registerFailure: (errorMessage: string) => void
  retryLastMessage: () => {
    sessionId: SessionIdentifier
    message: string
  } | null
  resetPending: () => void
  hydrateSessions: (sessions: RagSession[]) => void
}

const createFallbackStorage = (): Storage => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }

  const memoryStore = new Map<string, string>()

  return {
    get length() {
      return memoryStore.size
    },
    clear: () => memoryStore.clear(),
    getItem: (key: string) => memoryStore.get(key) ?? null,
    key: (index: number) => Array.from(memoryStore.keys())[index] ?? null,
    removeItem: (key: string) => {
      memoryStore.delete(key)
    },
    setItem: (key: string, value: string) => {
      memoryStore.set(key, value)
    },
  } as Storage
}

const INITIAL_SESSIONS = ragFixtures.sessions
const INITIAL_SELECTED = INITIAL_SESSIONS[0]?.id ?? null
const buildLastQueryMap = (sessions: RagSession[]) =>
  sessions.reduce<Record<SessionIdentifier, string | null>>(
    (accumulator, session) => {
      accumulator[session.id] = null
      return accumulator
    },
    {} as Record<SessionIdentifier, string | null>
  )
const INITIAL_LAST_QUERY_IDS = buildLastQueryMap(INITIAL_SESSIONS)

const createMessageId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `msg-${crypto.randomUUID()}`
  }

  return `msg-${Math.random().toString(36).slice(2)}`
}

const appendMessage = (
  sessions: RagSession[],
  sessionId: SessionIdentifier,
  message: RagMessage
): RagSession[] =>
  sessions.map((session) =>
    session.id === sessionId
      ? {
          ...session,
          messages: [...session.messages, message],
          updatedAt: message.createdAt,
        }
      : session
  )

export const useRagChatStore = create<RagChatState>()(
  persist(
    (set, get) => ({
      sessions: INITIAL_SESSIONS,
      selectedSessionId: INITIAL_SELECTED,
      lastQueryIds: INITIAL_LAST_QUERY_IDS,
      isLoading: false,
      error: null,
      pendingMessage: null,
      pendingSessionId: null,
      selectSession: (sessionId) => {
        set({
          selectedSessionId: sessionId,
          error: null,
          isLoading: false,
        })
      },
      queueUserMessage: (content) => {
        const { selectedSessionId } = get()
        if (!selectedSessionId) {
          return null
        }

        const timestamp = new Date().toISOString()
        const message: RagMessage = {
          id: createMessageId() as Identifier,
          role: 'user',
          content,
          createdAt: timestamp as ISODateString,
        }

        set((state) => ({
          sessions: appendMessage(state.sessions, selectedSessionId, message),
          pendingMessage: content,
          pendingSessionId: selectedSessionId,
          isLoading: true,
          error: null,
        }))

        return { sessionId: selectedSessionId, message }
      },
      completeAssistantMessage: ({ sessionId, message, lastQueryId }) => {
        set((state) => ({
          sessions: appendMessage(state.sessions, sessionId, message),
          lastQueryIds:
            typeof lastQueryId === 'undefined'
              ? state.lastQueryIds
              : {
                  ...state.lastQueryIds,
                  [sessionId]: lastQueryId,
                },
          isLoading: false,
          error: null,
          pendingMessage: null,
          pendingSessionId: null,
        }))
      },
      registerFailure: (errorMessage) => {
        set({
          isLoading: false,
          error: errorMessage,
        })
      },
      retryLastMessage: () => {
        const { pendingMessage, pendingSessionId } = get()
        if (!pendingMessage || !pendingSessionId) {
          return null
        }

        set({
          isLoading: true,
          error: null,
        })

        return { sessionId: pendingSessionId, message: pendingMessage }
      },
      resetPending: () => {
        set({
          pendingMessage: null,
          pendingSessionId: null,
          isLoading: false,
          error: null,
        })
      },
      hydrateSessions: (sessions) => {
        set({
          sessions,
          selectedSessionId: sessions[0]?.id ?? null,
          lastQueryIds: buildLastQueryMap(sessions),
          pendingMessage: null,
          pendingSessionId: null,
          isLoading: false,
          error: null,
        })
      },
    }),
    {
      name: 'rag-chat-store',
      storage: createJSONStorage(createFallbackStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        selectedSessionId: state.selectedSessionId,
        lastQueryIds: state.lastQueryIds,
        pendingMessage: state.pendingMessage,
        pendingSessionId: state.pendingSessionId,
      }),
    }
  )
)

export const buildAssistantMessage = (content: string): RagMessage => ({
  id: createMessageId() as Identifier,
  role: 'assistant',
  content,
  createdAt: new Date().toISOString() as ISODateString,
})
