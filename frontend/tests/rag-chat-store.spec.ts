import { beforeEach, describe, expect, it } from 'vitest'
import { useRagConsoleStore } from '@/features/rag-console/store'
import { ragFixtures } from '@/lib/api-mock/fixtures/rag'

const cloneFixtures = () =>
  ragFixtures.sessions.map((session) => ({
    ...session,
    messages: session.messages.map((message) => ({
      ...message,
      citations: message.citations ? [...message.citations] : undefined,
    })),
  }))

describe('useRagConsoleStore', () => {
  beforeEach(async () => {
    await useRagConsoleStore.persist?.clearStorage?.()
    useRagConsoleStore.getState().hydrateSessions(cloneFixtures())
  })

  it('排队用户消息并标记加载状态', () => {
    const queued = useRagConsoleStore.getState().queueUserMessage('需要帮我总结最近的解析错误情况吗？')

    expect(queued).not.toBeNull()

    const state = useRagConsoleStore.getState()
    expect(state.pendingMessage).toBe('需要帮我总结最近的解析错误情况吗？')
    expect(state.isStreaming).toBe(true)

    const selected = state.sessions.find((session) => session.id === state.selectedSessionId)
    expect(selected?.messages.at(-1)?.role).toBe('user')
  })

  it('成功响应后记录助理回复', () => {
    const sessionId = useRagConsoleStore.getState().selectedSessionId
    expect(sessionId).not.toBeNull()

    const queued = useRagConsoleStore.getState().queueUserMessage('讲一下最新的知识图谱构建步骤')
    expect(queued).not.toBeNull()

    // 开始助理消息
    const assistant = useRagConsoleStore.getState().beginAssistantMessage(queued!.sessionId)
    expect(assistant).not.toBeNull()

    // 添加内容
    useRagConsoleStore
      .getState()
      .appendAssistantContent(assistant!.sessionId, assistant!.messageId, '这是一个模拟的 RAG 回复')

    // 完成消息
    useRagConsoleStore.getState().finalizeAssistantMessage(
      assistant!.sessionId,
      assistant!.messageId,
      {
        queryId: 'graph-query-mock',
      }
    )

    const state = useRagConsoleStore.getState()
    expect(state.isStreaming).toBe(false)
    expect(state.pendingMessage).toBeNull()

    const selected = state.sessions.find((session) => session.id === sessionId)
    expect(selected?.messages.at(-1)?.role).toBe('assistant')
    expect(selected?.messages.at(-1)?.content).toContain('模拟的 RAG 回复')
  })

  it('失败后保留最近用户消息供重试', () => {
    const initialState = useRagConsoleStore.getState()
    const initialSession = initialState.sessions.find((session) => session.id === initialState.selectedSessionId)
    const initialCount = initialSession?.messages.length ?? 0

    const queued = useRagConsoleStore.getState().queueUserMessage('触发失败的测试消息')
    expect(queued).not.toBeNull()

    useRagConsoleStore.getState().registerFailure('网络错误')

    const retryPayload = useRagConsoleStore.getState().retryLastMessage()
    expect(retryPayload).toEqual({
      sessionId: queued!.sessionId,
      message: '触发失败的测试消息',
    })

    const state = useRagConsoleStore.getState()
    const session = state.sessions.find((item) => item.id === state.selectedSessionId)

    expect(state.error).toBeNull()
    expect(state.isStreaming).toBe(true)
    expect(session?.messages.length).toBe(initialCount + 1)
  })
})
