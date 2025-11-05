import { http, HttpResponse } from 'msw'
import { authFixtures } from '../fixtures/auth'
import dashboardData from '../fixtures/dashboard.json'

function extractBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null
  const [scheme, token] = headerValue.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

export const dashboardHandlers = [
  http.get('*/api/v1/dashboard/summary', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json(dashboardData.summary)
  }),

  http.get('*/api/v1/dashboard/query-trend', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json(dashboardData.queryTrend)
  }),

  http.get('*/api/v1/dashboard/source-status', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json(dashboardData.sourceStatus)
  }),
]
