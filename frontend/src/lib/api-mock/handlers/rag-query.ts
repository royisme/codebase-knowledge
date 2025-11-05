import { HttpResponse, http, delay } from 'msw'
import { authFixtures } from '../fixtures/auth'
import { executeRagQueryFixture } from '../fixtures/rag-query'

function extractBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null
  const [scheme, token] = headerValue.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

interface QueryPayload {
  query: string
  source_ids: string[]
  mode?: string
  max_results?: number
  include_evidence?: boolean
  timeout_seconds?: number
}

export const ragQueryHandlers = [
  // RAG 查询接口
  http.post('*/api/v1/knowledge/query', async ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const payload = (await request.json()) as QueryPayload

    // 验证必填字段
    if (!payload?.query || !payload.query.trim()) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: '查询问题不能为空',
        },
        { status: 400 }
      )
    }

    if (
      !payload?.source_ids ||
      !Array.isArray(payload.source_ids) ||
      payload.source_ids.length === 0
    ) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: '请至少选择一个知识源',
        },
        { status: 400 }
      )
    }

    // 模拟网络延迟（500-1500ms）
    await delay(Math.floor(Math.random() * 1000) + 500)

    try {
      const response = executeRagQueryFixture({
        query: payload.query,
        source_ids: payload.source_ids,
        mode: (payload.mode || 'hybrid') as 'graph' | 'vector' | 'hybrid',
        max_results: payload.max_results || 8,
        include_evidence: payload.include_evidence !== false,
        timeout_seconds: payload.timeout_seconds || 30,
      })

      return HttpResponse.json(response)
    } catch {
      return HttpResponse.json(
        {
          code: 'QUERY_ERROR',
          message: '查询执行失败，请稍后重试',
        },
        { status: 500 }
      )
    }
  }),
]
