// Temporary placeholder file - original file had syntax errors and was backed up
import { http, HttpResponse } from 'msw'

export const graphRAGHandlers = [
  http.get('/api/v1/knowledge/query/health', () => {
    return new HttpResponse(
      JSON.stringify({
        status: 'healthy',
        service: 'graphrag-api',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }),
]
