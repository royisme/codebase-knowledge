import type { Job } from '@/types/job'
import { http, HttpResponse, delay } from 'msw'
import { authFixtures } from '../fixtures/auth'
import { mockJobs, mockJobLogs } from '../fixtures/jobs'

function extractBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null
  const [scheme, token] = headerValue.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

// 可变状态
const jobs = [...mockJobs]

export const jobHandlers = [
  // 获取任务列表
  http.get('*/api/v1/admin/jobs', async ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    await delay(300)

    const url = new URL(request.url)
    const sourceId = url.searchParams.get('source_id')
    const status = url.searchParams.get('status')
    const page = Number.parseInt(url.searchParams.get('page') || '1')
    const pageSize = Number.parseInt(url.searchParams.get('pageSize') || '10')

    let filtered = [...jobs]

    // 按 source_id 过滤
    if (sourceId) {
      filtered = filtered.filter((j) => j.source_id === sourceId)
    }

    // 按状态过滤
    if (status) {
      filtered = filtered.filter((j) => j.status === status)
    }

    // 按创建时间倒序
    filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // 分页
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const items = filtered.slice(start, end)

    return HttpResponse.json({
      items,
      total: filtered.length,
      page,
      pageSize,
    })
  }),

  // 获取任务详情（含日志）
  http.get('*/api/v1/admin/jobs/:id', async ({ params, request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    await delay(300)

    const job = jobs.find((j) => j.id === params.id)

    if (!job) {
      return HttpResponse.json({ detail: 'Job not found' }, { status: 404 })
    }

    // 添加日志
    const logs = mockJobLogs[params.id as string] || []

    return HttpResponse.json({
      ...job,
      logs,
    })
  }),

  // 取消任务
  http.post('*/api/v1/admin/jobs/:id/cancel', async ({ params, request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    await delay(500)

    const job = jobs.find((j) => j.id === params.id)

    if (!job) {
      return HttpResponse.json({ detail: 'Job not found' }, { status: 404 })
    }

    if (job.status !== 'running') {
      return HttpResponse.json(
        { detail: 'Only running jobs can be cancelled' },
        { status: 400 }
      )
    }

    // 更新状态为已取消
    job.status = 'cancelled'
    job.completed_at = new Date().toISOString()
    job.updated_at = new Date().toISOString()

    return new HttpResponse(null, { status: 204 })
  }),

  // 重试任务
  http.post('*/api/v1/admin/jobs/:id/retry', async ({ params, request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    await delay(500)

    const originalJob = jobs.find((j) => j.id === params.id)

    if (!originalJob) {
      return HttpResponse.json({ detail: 'Job not found' }, { status: 404 })
    }

    if (originalJob.status !== 'failed') {
      return HttpResponse.json(
        { detail: 'Only failed jobs can be retried' },
        { status: 400 }
      )
    }

    // 创建新任务
    const newJob: Job = {
      id: crypto.randomUUID(),
      source_id: originalJob.source_id,
      status: 'pending',
      progress_percentage: 0,
      items_processed: 0,
      total_items: originalJob.total_items,
      job_config: {
        stage: 'git_clone',
        retry_count: 0,
        max_retries: 3,
        timeout_seconds: 900,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    jobs.push(newJob)

    return HttpResponse.json(newJob)
  }),
]
