import type { RetryTaskPayload } from '@/types'
import { HttpResponse, http } from 'msw'
import { taskFixtures } from '../fixtures/tasks'

export const taskHandlers = [
  http.get('/api/tasks', () => {
    return HttpResponse.json(taskFixtures.list)
  }),

  http.post('/api/tasks/retry', async ({ request }) => {
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
