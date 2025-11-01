import type { RetryTaskPayload } from '@/types'
import { HttpResponse, http } from 'msw'
import { authFixtures } from '../fixtures/auth'
import { taskFixtures } from '../fixtures/tasks'

function extractBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null
  const [scheme, token] = headerValue.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

export const taskHandlers = [
  http.get('*/api/v1/admin/tasks', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json(taskFixtures.list)
  }),

  http.post('*/api/v1/admin/tasks/retry', async ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const payload = (await request.json()) as Partial<RetryTaskPayload>
    if (!payload?.taskId) {
      return HttpResponse.json(
        {
          code: 'TASK_NOT_FOUND',
          message: '无法找到指定任务',
        },
        { status: 404 }
      )
    }
    return HttpResponse.json({ success: true })
  }),
]
