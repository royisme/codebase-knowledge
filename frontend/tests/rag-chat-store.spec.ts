import { beforeEach, describe, expect, it } from 'vitest'
import { buildAssistantMessage, useRagChatStore } from '@/features/rag-console/store'
import { ragFixtures } from '@/lib/api-mock/fixtures/rag'

const cloneFixtures = () =>
  ragFixtures.sessions.map((session) => ({
    ...session,
    messages: session.messages.map((message) => ({
      ...message,
      citations: message.citations ? [...message.citations] : undefined,
    })),
  }))

describe('useRagChatStore', () => {
  beforeEach(async () => {
    await useRagChatStore.persist?.clearStorage?.()
    useRagChatStore.getState().hydrateSessions(cloneFixtures())
  })

  it('排队用户消息并标记加载状态', () => {
    const queued = useRagChatStore.getState().queueUserMessage('需要帮我总结最近的解析错误情况吗？')

    expect(queued).not.toBeNull()

    const state = useRagChatStore.getState()
    expect(state.pendingMessage).toBe('需要帮我总结最近的解析错误情况吗？')
    expect(state.isLoading).toBe(true)

    const selected = state.sessions.find((session) => session.id === state.selectedSessionId)
    expect(selected?.messages.at(-1)?.role).toBe('user')
  })

  it('成功响应后记录助理回复与 query id', () => {
    const sessionId = useRagChatStore.getState().selectedSessionId
    expect(sessionId).not.toBeNull()

    const queued = useRagChatStore.getState().queueUserMessage('讲一下最新的知识图谱构建步骤')
    expect(queued).not.toBeNull()

    const assistantMessage = buildAssistantMessage('这是一个模拟的 RAG 回复')
    useRagChatStore
      .getState()
      .completeAssistantMessage({
        sessionId: queued!.sessionId,
        message: assistantMessage,
        lastQueryId: 'graph-query-mock',
      })

    const state = useRagChatStore.getState()
    expect(state.isLoading).toBe(false)
    expect(state.pendingMessage).toBeNull()
    expect(state.lastQueryIds[queued!.sessionId]).toBe('graph-query-mock')

    const selected = state.sessions.find((session) => session.id === sessionId)
    expect(selected?.messages.at(-1)?.role).toBe('assistant')
  })

  it('失败后保留最近用户消息供重试', () => {
    const initialState = useRagChatStore.getState()
    const initialSession = initialState.sessions.find((session) => session.id === initialState.selectedSessionId)
    const initialCount = initialSession?.messages.length ?? 0

    const queued = useRagChatStore.getState().queueUserMessage('触发失败的测试消息')
    expect(queued).not.toBeNull()

    useRagChatStore.getState().registerFailure('网络错误')

    const retryPayload = useRagChatStore.getState().retryLastMessage()
    expect(retryPayload).toEqual({
      sessionId: queued!.sessionId,
      message: '触发失败的测试消息',
    })

    const state = useRagChatStore.getState()
    const session = state.sessions.find((item) => item.id === state.selectedSessionId)

    expect(state.error).toBeNull()
    expect(state.isLoading).toBe(true)
    expect(session?.messages.length).toBe(initialCount + 1)
  })
})
