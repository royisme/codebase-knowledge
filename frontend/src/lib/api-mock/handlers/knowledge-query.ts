import { http, HttpResponse } from 'msw'
import { createSSEEvent, splitIntoChunks, sleep } from '@/lib/sse-parser'
import { authFixtures } from '../fixtures/auth'
import queryData from '../fixtures/knowledge-query.json'

function extractBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null
  const [scheme, token] = headerValue.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

export const knowledgeQueryHandlers = [
  // POST /api/v1/knowledge/query/stream - 流式查询（新增）
  http.post('*/api/v1/knowledge/query/stream', async ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as {
      question: string
      source_ids?: string[]
      session_id?: string
      retrieval_mode?: string
      top_k?: number
      timeout?: number
    }

    if (!body.question) {
      return HttpResponse.json(
        { detail: 'Question is required' },
        { status: 400 }
      )
    }

    // 使用第一个查询结果作为 Mock 数据源
    const mockData = queryData.queries[0]
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 1. 流式发送答案文本
          const answerChunks = splitIntoChunks(mockData.answer)
          for (const chunk of answerChunks) {
            controller.enqueue(
              encoder.encode(createSSEEvent('text', { content: chunk }))
            )
            await sleep(50) // 模拟打字机效果
          }

          // 2. 发送关联实体
          const entities = [
            {
              type: 'file',
              name: 'auth.py',
              importance: 'high',
              detail: '用户认证核心模块',
              link: '/files/app/core/auth.py',
            },
            {
              type: 'module',
              name: 'FastAPI Users',
              importance: 'medium',
              detail: 'FastAPI 认证框架',
            },
            {
              type: 'commit',
              name: 'abc123: Add JWT authentication',
              importance: 'medium',
              detail: '添加 JWT 认证支持',
              link: '/commits/abc123',
            },
          ]

          for (const entity of entities) {
            controller.enqueue(
              encoder.encode(createSSEEvent('entity', { entity }))
            )
            await sleep(100)
          }

          // 3. 发送元数据
          const metadata = {
            execution_time_ms: 1234,
            sources_queried: body.source_ids || ['ks-1'],
            confidence_score: 0.92,
            retrieval_mode: body.retrieval_mode || 'hybrid',
            from_cache: false,
          }
          controller.enqueue(
            encoder.encode(createSSEEvent('metadata', { data: metadata }))
          )

          // 4. 发送完成事件
          const queryId = `q-${Date.now()}`
          controller.enqueue(
            encoder.encode(
              createSSEEvent('done', {
                query_id: queryId,
                timestamp: new Date().toISOString(),
              })
            )
          )

          controller.close()
        } catch (error) {
          // 发送错误事件
          controller.enqueue(
            encoder.encode(
              createSSEEvent('error', {
                message:
                  error instanceof Error ? error.message : 'Unknown error',
              })
            )
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }),
  // POST /api/v1/knowledge/query - 提交问题查询
  http.post('*/api/v1/knowledge/query', async ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as {
      question: string
      source_ids?: string[]
      session_id?: string
    }

    if (!body.question) {
      return HttpResponse.json(
        { detail: 'Question is required' },
        { status: 400 }
      )
    }

    // 模拟查询延迟
    await new Promise((resolve) => setTimeout(resolve, 800))

    // 返回第一个查询结果作为示例
    const result = queryData.queries[0]
    return HttpResponse.json(
      {
        ...result,
        id: `q-${Date.now()}`,
        question: body.question,
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),

  // GET /api/v1/knowledge/query/:query_id - 获取查询详情
  http.get('*/api/v1/knowledge/query/:query_id', ({ params, request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const { query_id } = params
    const query = queryData.queries.find((q) => q.id === query_id)

    if (!query) {
      return HttpResponse.json({ detail: 'Query not found' }, { status: 404 })
    }

    return HttpResponse.json(query)
  }),

  // GET /api/v1/knowledge/search - 搜索历史查询
  http.get('*/api/v1/knowledge/search', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const q = url.searchParams.get('q')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    let results = queryData.queries

    if (q) {
      const lowerQ = q.toLowerCase()
      results = results.filter(
        (query) =>
          query.question.toLowerCase().includes(lowerQ) ||
          query.answer.toLowerCase().includes(lowerQ)
      )
    }

    return HttpResponse.json({
      items: results.slice(0, limit),
      total: results.length,
    })
  }),

  // GET /api/v1/knowledge/sessions - 获取会话列表
  http.get('*/api/v1/knowledge/sessions', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    return HttpResponse.json({
      items: queryData.sessions,
      total: queryData.sessions.length,
    })
  }),

  // GET /api/v1/knowledge/stats - 获取统计信息
  http.get('*/api/v1/knowledge/stats', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    return HttpResponse.json(queryData.stats)
  }),

  // GET /api/v1/knowledge/notes - 获取笔记列表
  http.get('*/api/v1/knowledge/notes', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    return HttpResponse.json({
      items: queryData.notes,
      total: queryData.notes.length,
    })
  }),

  // POST /api/v1/knowledge/notes - 创建笔记
  http.post('*/api/v1/knowledge/notes', async ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as {
      query_id: string
      title: string
      content?: string
      tags?: string[]
    }

    const note = {
      id: `note-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
      user_id: 'user-1',
    }

    return HttpResponse.json(note, { status: 201 })
  }),

  // DELETE /api/v1/knowledge/notes/:note_id - 删除笔记
  http.delete('*/api/v1/knowledge/notes/:note_id', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    return HttpResponse.json({ success: true }, { status: 200 })
  }),
]
