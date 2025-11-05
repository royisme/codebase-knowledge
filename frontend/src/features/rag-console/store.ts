import type { Identifier, ISODateString } from '@/types/common'
import type { Entity } from '@/types/graph-query'
import type { RagMessage, RagSession, RagEvidence } from '@/types/rag'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type SessionIdentifier = RagSession['id']
type MessageIdentifier = RagMessage['id']

interface RagConsoleState {
  sessions: RagSession[]
  selectedSessionId: SessionIdentifier | null
  isStreaming: boolean
  error: string | null
  pendingMessage: string | null
  pendingSessionId: SessionIdentifier | null
  streamingMessageId: MessageIdentifier | null

  selectSession: (sessionId: SessionIdentifier) => void
  createSession: (title?: string) => SessionIdentifier
  ensureSession: () => SessionIdentifier
  queueUserMessage: (content: string) => {
    sessionId: SessionIdentifier
    messageId: MessageIdentifier
  } | null
  beginAssistantMessage: (
    sessionId: SessionIdentifier
  ) => { sessionId: SessionIdentifier; messageId: MessageIdentifier } | null
  appendAssistantContent: (
    sessionId: SessionIdentifier,
    messageId: MessageIdentifier,
    chunk: string
  ) => void
  appendAssistantEntity: (
    sessionId: SessionIdentifier,
    messageId: MessageIdentifier,
    entity: Entity
  ) => void
  appendAssistantEvidence: (
    sessionId: SessionIdentifier,
    messageId: MessageIdentifier,
    evidence: RagEvidence
  ) => void
  updateAssistantMetadata: (
    sessionId: SessionIdentifier,
    messageId: MessageIdentifier,
    metadata: {
      confidenceScore?: number
      processingTimeMs?: number
      sourcesQueried?: string[]
    }
  ) => void
  updateNextActions: (
    sessionId: SessionIdentifier,
    messageId: MessageIdentifier,
    actions: string[]
  ) => void
  finalizeAssistantMessage: (
    sessionId: SessionIdentifier,
    messageId: MessageIdentifier,
    payload: {
      queryId?: string
      actions?: string[]
      confidenceScore?: number
      processingTimeMs?: number
      sourcesQueried?: string[]
      summary?: string
    }
  ) => void
  registerFailure: (message: string) => void
  clearError: () => void
  retryLastMessage: () => {
    sessionId: SessionIdentifier
    message: string
  } | null
  resetPending: () => void
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

const createIdentifier = (): Identifier => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID() as Identifier
  }

  return `id-${Math.random().toString(36).slice(2)}` as Identifier
}

const nowIso = (): ISODateString => new Date().toISOString() as ISODateString

const ensureSessionExists = (
  sessions: RagSession[],
  sessionId: SessionIdentifier
) => sessions.find((session) => session.id === sessionId)

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

export const useRagConsoleStore = create<RagConsoleState>()(
  persist(
    (set, get) => ({
      sessions: [],
      selectedSessionId: null,
      isStreaming: false,
      error: null,
      pendingMessage: null,
      pendingSessionId: null,
      streamingMessageId: null,

      selectSession: (sessionId) => {
        const state = get()
        if (!ensureSessionExists(state.sessions, sessionId)) {
          return
        }
        if (state.selectedSessionId === sessionId) {
          return
        }
        set({
          selectedSessionId: sessionId,
          error: null,
        })
      },

      createSession: (title) => {
        const sessionId = createIdentifier()
        const timestamp = nowIso()

        const newSession: RagSession = {
          id: sessionId,
          repositoryId: 'rag-console' as Identifier,
          title: title?.trim() || '新对话',
          createdAt: timestamp,
          updatedAt: timestamp,
          participants: [],
          messages: [],
          lastQueryId: null,
          quickActions: [],
        }

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          selectedSessionId: sessionId,
          error: null,
        }))

        return sessionId
      },

      ensureSession: () => {
        const state = get()
        if (state.selectedSessionId) {
          const existing = ensureSessionExists(
            state.sessions,
            state.selectedSessionId
          )
          if (existing) {
            return state.selectedSessionId
          }
        }
        return get().createSession()
      },

      queueUserMessage: (content) => {
        const trimmed = content.trim()
        if (!trimmed) {
          return null
        }

        const sessionId = get().ensureSession()
        const messageId = createIdentifier()
        const timestamp = nowIso()

        const message: RagMessage = {
          id: messageId,
          role: 'user',
          content: trimmed,
          createdAt: timestamp,
        }

        set((state) => ({
          sessions: appendMessage(state.sessions, sessionId, message),
          pendingMessage: trimmed,
          pendingSessionId: sessionId,
          streamingMessageId: null,
          isStreaming: true,
          error: null,
        }))

        return { sessionId, messageId }
      },

      beginAssistantMessage: (sessionId) => {
        const existingSession = ensureSessionExists(get().sessions, sessionId)
        if (!existingSession) {
          return null
        }

        const messageId = createIdentifier()
        const timestamp = nowIso()
        const message: RagMessage = {
          id: messageId,
          role: 'assistant',
          content: '',
          createdAt: timestamp,
          status: 'streaming',
          citations: [],
          entities: [],
          queryId: null,
          metadata: {},
          nextActions: [],
        }

        set((state) => ({
          sessions: appendMessage(state.sessions, sessionId, message),
          streamingMessageId: messageId,
          isStreaming: true,
          error: null,
        }))

        return { sessionId, messageId }
      },

      appendAssistantContent: (sessionId, messageId, chunk) => {
        if (!chunk) {
          return
        }

        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id !== sessionId
              ? session
              : {
                  ...session,
                  messages: session.messages.map((message) =>
                    message.id === messageId
                      ? {
                          ...message,
                          content: `${message.content}${chunk}`,
                          status: 'streaming',
                        }
                      : message
                  ),
                }
          ),
        }))
      },

      appendAssistantEntity: (sessionId, messageId, entity) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id !== sessionId
              ? session
              : {
                  ...session,
                  messages: session.messages.map((message) =>
                    message.id === messageId
                      ? {
                          ...message,
                          entities: [...(message.entities ?? []), entity],
                        }
                      : message
                  ),
                }
          ),
        }))
      },

      appendAssistantEvidence: (sessionId, messageId, evidence) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id !== sessionId
              ? session
              : {
                  ...session,
                  messages: session.messages.map((message) =>
                    message.id === messageId
                      ? {
                          ...message,
                          evidence: [...(message.evidence ?? []), evidence],
                        }
                      : message
                  ),
                }
          ),
        }))
      },

      updateAssistantMetadata: (sessionId, messageId, metadata) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id !== sessionId
              ? session
              : {
                  ...session,
                  messages: session.messages.map((message) =>
                    message.id === messageId
                      ? {
                          ...message,
                          metadata: {
                            ...message.metadata,
                            ...metadata,
                          },
                        }
                      : message
                  ),
                }
          ),
        }))
      },

      updateNextActions: (sessionId, messageId, actions) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id !== sessionId
              ? session
              : {
                  ...session,
                  messages: session.messages.map((message) =>
                    message.id === messageId
                      ? {
                          ...message,
                          nextActions: [...actions],
                        }
                      : message
                  ),
                  quickActions: [...actions],
                }
          ),
        }))
      },

      finalizeAssistantMessage: (sessionId, messageId, payload) => {
        const timestamp = nowIso()

        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id !== sessionId
              ? session
              : {
                  ...session,
                  messages: session.messages.map((message) =>
                    message.id === messageId
                      ? {
                          ...message,
                          status: 'completed',
                          queryId: payload.queryId ?? message.queryId,
                          metadata: {
                            ...message.metadata,
                            confidenceScore:
                              payload.confidenceScore ??
                              message.metadata?.confidenceScore,
                            processingTimeMs:
                              payload.processingTimeMs ??
                              message.metadata?.processingTimeMs,
                            sourcesQueried:
                              payload.sourcesQueried ??
                              message.metadata?.sourcesQueried,
                          },
                          nextActions: payload.actions ?? message.nextActions,
                        }
                      : message
                  ),
                  updatedAt: timestamp,
                  lastQueryId: payload.queryId ?? session.lastQueryId ?? null,
                  quickActions: payload.actions ?? session.quickActions ?? [],
                }
          ),
          isStreaming: false,
          error: null,
          pendingMessage: null,
          pendingSessionId: null,
          streamingMessageId: null,
        }))
      },

      registerFailure: (message) => {
        const { streamingMessageId, selectedSessionId } = get()
        if (streamingMessageId && selectedSessionId) {
          set((state) => ({
            sessions: state.sessions.map((session) =>
              session.id !== selectedSessionId
                ? session
                : {
                    ...session,
                    messages: session.messages.map((msg) =>
                      msg.id === streamingMessageId
                        ? {
                            ...msg,
                            status: 'error',
                            error: message,
                          }
                        : msg
                    ),
                  }
            ),
          }))
        }

        set({
          isStreaming: false,
          error: message,
        })
      },

      clearError: () => set({ error: null }),

      retryLastMessage: () => {
        const { pendingMessage, pendingSessionId } = get()
        if (!pendingMessage || !pendingSessionId) {
          return null
        }
        set((state) => ({
          isStreaming: true,
          error: null,
          sessions: state.sessions.map((session) =>
            session.id === pendingSessionId
              ? {
                  ...session,
                  messages: session.messages.map((message) =>
                    message.id === state.streamingMessageId
                      ? { ...message, status: 'streaming', error: null }
                      : message
                  ),
                }
              : session
          ),
        }))
        return { sessionId: pendingSessionId, message: pendingMessage }
      },

      resetPending: () => {
        set({
          pendingMessage: null,
          pendingSessionId: null,
          streamingMessageId: null,
        })
      },
    }),
    {
      name: 'rag-console-store',
      storage: createJSONStorage(createFallbackStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        selectedSessionId: state.selectedSessionId,
      }),
    }
  )
)
