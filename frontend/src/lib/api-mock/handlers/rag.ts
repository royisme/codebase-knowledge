import type {
  RagSession,
  RagMessage,
  RagCitation,
  Identifier,
  ISODateString,
} from '@/types'
import { HttpResponse, http } from 'msw'
import { authFixtures } from '../fixtures/auth'
import { ragFixtures } from '../fixtures/rag'

function extractBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null
  const [scheme, token] = headerValue.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

// Mock data store - in a real app this would be in a database
const sessions = [...ragFixtures.sessions]
let messageIdCounter = 100 // Start from a high number to avoid conflicts
let sessionIdCounter = 10

export const ragHandlers = [
  // Get all RAG sessions
  http.get('*/api/v1/rag/sessions', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json({
      data: sessions.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
      total: sessions.length,
    })
  }),

  // Get a specific RAG session
  http.get('*/api/v1/rag/sessions/:sessionId', ({ params, request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const { sessionId } = params
    const session = sessions.find((s) => s.id === sessionId)

    if (!session) {
      return HttpResponse.json(
        {
          code: 'SESSION_NOT_FOUND',
          message: '会话不存在，请刷新后重试',
        },
        { status: 404 }
      )
    }

    return HttpResponse.json({ data: session })
  }),

  // Create a new RAG session
  http.post('*/api/v1/rag/sessions', async ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const body = (await request.json()) as {
      title?: string
      repositoryId?: string
      question?: string
    }

    const newSession: RagSession = {
      id: `session-${sessionIdCounter++}` as Identifier,
      repositoryId: (body.repositoryId || 'default-repo') as Identifier,
      title: body.title || body.question || '新的 RAG 会话',
      createdAt: new Date().toISOString() as ISODateString,
      updatedAt: new Date().toISOString() as ISODateString,
      participants: ['user-1' as Identifier],
      messages: body.question
        ? [
            {
              id: `msg-${messageIdCounter++}` as Identifier,
              role: 'user',
              content: body.question,
              createdAt: new Date().toISOString() as ISODateString,
            },
          ]
        : [],
    }

    sessions.unshift(newSession)

    return HttpResponse.json({ data: newSession }, { status: 201 })
  }),

  // Delete a RAG session
  http.delete('*/api/v1/rag/sessions/:sessionId', ({ params, request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const { sessionId } = params
    const index = sessions.findIndex((s) => s.id === sessionId)

    if (index === -1) {
      return HttpResponse.json(
        {
          code: 'SESSION_NOT_FOUND',
          message: '会话不存在，请刷新后重试',
        },
        { status: 404 }
      )
    }

    const deletedSession = sessions[index]
    sessions.splice(index, 1)

    return HttpResponse.json({ data: deletedSession })
  }),

  // Send a message and get AI response
  http.post(
    '*/api/v1/rag/sessions/:sessionId/messages',
    async ({ params, request }) => {
      const token = extractBearerToken(request.headers.get('authorization'))
      if (!token || !authFixtures.findUserByToken(token)) {
        return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
      }
      const { sessionId } = params
      const body = (await request.json()) as { content: string }

      const session = sessions.find((s) => s.id === sessionId)
      if (!session) {
        return HttpResponse.json(
          {
            code: 'SESSION_NOT_FOUND',
            message: '会话不存在，请刷新后重试',
          },
          { status: 404 }
        )
      }

      // Add user message
      const userMessage: RagMessage = {
        id: `msg-${messageIdCounter++}` as Identifier,
        role: 'user',
        content: body.content,
        createdAt: new Date().toISOString() as ISODateString,
      }

      // Generate AI response (mock)
      const aiResponse = await generateMockAIResponse(
        body.content,
        session.repositoryId
      )

      const assistantMessage: RagMessage = {
        id: `msg-${messageIdCounter++}` as Identifier,
        role: 'assistant',
        content: aiResponse.content,
        createdAt: new Date().toISOString() as ISODateString,
        citations: aiResponse.citations,
      }

      // Update session
      session.messages.push(userMessage, assistantMessage)
      session.updatedAt = new Date().toISOString() as ISODateString

      return HttpResponse.json({
        data: {
          userMessage,
          assistantMessage,
        },
      })
    }
  ),

  // Get message citations/evidence
  http.get(
    '/api/v1/rag/sessions/:sessionId/messages/:messageId/citations',
    ({ params }) => {
      const { sessionId, messageId } = params

      const session = sessions.find((s) => s.id === sessionId)
      if (!session) {
        return HttpResponse.json(
          {
            code: 'SESSION_NOT_FOUND',
            message: '会话不存在，请刷新后重试',
          },
          { status: 404 }
        )
      }

      const message = session.messages.find((m) => m.id === messageId)
      if (!message) {
        return HttpResponse.json(
          {
            code: 'MESSAGE_NOT_FOUND',
            message: '消息不存在，请刷新后重试',
          },
          { status: 404 }
        )
      }

      return HttpResponse.json({
        data: message.citations || [],
      })
    }
  ),

  // Refresh/rebuild session context
  http.post('/api/v1/rag/sessions/:sessionId/refresh', async ({ params }) => {
    const { sessionId } = params

    const session = sessions.find((s) => s.id === sessionId)
    if (!session) {
      return HttpResponse.json(
        {
          code: 'SESSION_NOT_FOUND',
          message: '会话不存在，请刷新后重试',
        },
        { status: 404 }
      )
    }

    // Simulate rebuilding process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Update session timestamp
    session.updatedAt = new Date().toISOString() as ISODateString

    return HttpResponse.json({
      data: {
        message: 'Session context refreshed successfully',
        session,
      },
    })
  }),

  // Export session
  http.get('/api/v1/rag/sessions/:sessionId/export', ({ params }) => {
    const { sessionId } = params

    const session = sessions.find((s) => s.id === sessionId)
    if (!session) {
      return HttpResponse.json(
        {
          code: 'SESSION_NOT_FOUND',
          message: '会话不存在，请刷新后重试',
        },
        { status: 404 }
      )
    }

    // Generate export data (mock format)
    const exportData = {
      title: session.title,
      createdAt: session.createdAt,
      messages: session.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
        citations: msg.citations || [],
      })),
      exportedAt: new Date().toISOString(),
    }

    return HttpResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="rag-session-${sessionId}.json"`,
      },
    })
  }),

  // Search within sessions
  http.get('/api/v1/rag/search', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q') || ''

    if (!query.trim()) {
      return HttpResponse.json({ data: [], total: 0 })
    }

    const results = sessions
      .filter(
        (session) =>
          session.title.toLowerCase().includes(query.toLowerCase()) ||
          session.messages.some((msg) =>
            msg.content.toLowerCase().includes(query.toLowerCase())
          )
      )
      .map((session) => ({
        id: session.id,
        title: session.title,
        repositoryId: session.repositoryId,
        updatedAt: session.updatedAt,
        matchingMessages: session.messages
          .filter((msg) =>
            msg.content.toLowerCase().includes(query.toLowerCase())
          )
          .map((msg) => ({
            id: msg.id,
            content: msg.content.substring(0, 200) + '...',
            role: msg.role,
            timestamp: msg.createdAt,
          })),
      }))

    return HttpResponse.json({
      data: results,
      total: results.length,
    })
  }),
]

// Mock AI response generation
async function generateMockAIResponse(
  question: string,
  repositoryId: string
): Promise<{
  content: string
  citations: RagCitation[]
}> {
  // Simulate API delay
  await new Promise((resolve) =>
    setTimeout(resolve, 1000 + Math.random() * 2000)
  )

  const responses = [
    {
      content: `基于对"${question}"的分析，我找到了相关的解决方案。这个问题通常涉及到配置优化和代码调整。建议按照以下步骤进行排查：\n\n1. 检查相关配置文件\n2. 查看日志文件中的错误信息\n3. 验证代码逻辑是否正确\n\n需要我为您提供更详细的指导吗？`,
      citations: [
        {
          id: `cite-${Date.now()}-1` as Identifier,
          label: '配置文件示例',
          resourceUri: `file://config/${repositoryId}/settings.yml`,
          score: 0.89 + Math.random() * 0.1,
        },
        {
          id: `cite-${Date.now()}-2` as Identifier,
          label: '错误处理文档',
          resourceUri: `file://docs/troubleshooting.md`,
          score: 0.85 + Math.random() * 0.1,
        },
      ],
    },
    {
      content: `关于"${question}"，我找到了以下关键信息：\n\n根据代码分析，这个功能在最近的更新中有所改进。主要变化包括性能优化和错误处理增强。\n\n具体来说：\n- 优化了数据查询逻辑\n- 增加了缓存机制\n- 改进了错误提示信息\n\n您可以查看相关的提交记录了解详细信息。`,
      citations: [
        {
          id: `cite-${Date.now()}-3` as Identifier,
          label: '源代码文件',
          resourceUri: `file://src/${repositoryId}/main.ts`,
          score: 0.92 + Math.random() * 0.08,
        },
        {
          id: `cite-${Date.now()}-4` as Identifier,
          label: '更新日志',
          resourceUri: `file://CHANGELOG.md`,
          score: 0.88 + Math.random() * 0.1,
        },
      ],
    },
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}
