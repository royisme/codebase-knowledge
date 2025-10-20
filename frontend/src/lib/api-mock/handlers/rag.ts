import { HttpResponse, http } from 'msw'

import { ragFixtures } from '../fixtures/rag'

export const ragHandlers = [
  http.get('/api/rag/sessions/:sessionId', ({ params }) => {
    if (params.sessionId !== 'session-1') {
      return HttpResponse.json(
        {
          code: 'SESSION_NOT_FOUND',
          message: '会话不存在，请刷新后重试',
        },
        { status: 404 }
      )
    }
    return HttpResponse.json(ragFixtures.session)
  }),
]
