import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import type { JobStage, JobStatus } from '@/types/job'
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getJobDetail } from '@/lib/job-service'
import { getRepository } from '@/lib/repository-service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ErrorState } from '@/components/ui/error-state'
import { Progress } from '@/components/ui/progress'
import { JobLogViewer } from '../components/JobLogViewer'
import { JobStageIndicator } from '../components/JobStageIndicator'

const JOB_STATUS_CONFIG: Record<
  JobStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'outline' | 'destructive'
  }
> = {
  pending: { label: '待处理', variant: 'secondary' },
  running: { label: '运行中', variant: 'default' },
  completed: { label: '已完成', variant: 'outline' },
  failed: { label: '失败', variant: 'destructive' },
  cancelled: { label: '已取消', variant: 'secondary' },
}

const formatDuration = (startedAt?: string, completedAt?: string | null) => {
  if (!startedAt) return '-'

  const start = new Date(startedAt)
  const end = completedAt ? new Date(completedAt) : new Date()
  const seconds = Math.floor((end.getTime() - start.getTime()) / 1000)

  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
  return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`
}

export function JobDetailPage() {
  const { repoId, jobId } = useParams({
    from: '/admin/repositories/$repoId/jobs/$jobId',
  })

  const { data: repository, isError: isRepositoryError } = useQuery<
    Awaited<ReturnType<typeof getRepository>>
  >({
    queryKey: ['repository', repoId],
    queryFn: () => getRepository(repoId),
  })

  const {
    data: job,
    isLoading,
    refetch,
    isError,
  } = useQuery<Awaited<ReturnType<typeof getJobDetail>>>({
    queryKey: ['job', jobId],
    queryFn: () => getJobDetail(jobId),
    refetchInterval: (query) =>
      query.state.data?.status === 'running' ? 3000 : false,
  })

  useEffect(() => {
    if (isRepositoryError) {
      toast.error('仓库信息加载失败')
    }
  }, [isRepositoryError])

  useEffect(() => {
    if (isError) {
      toast.error('任务详情加载失败，请稍后重试')
    }
  }, [isError])

  if (isLoading) {
    return (
      <div className='container mx-auto py-6'>
        <div className='flex h-96 items-center justify-center'>
          <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className='container mx-auto py-6'>
        <ErrorState
          title='无法加载任务详情'
          description='请刷新页面或稍后再试，若问题持续请联系平台团队。'
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  if (!job) {
    return (
      <div className='container mx-auto py-6'>
        <div className='text-center'>
          <p className='text-muted-foreground'>任务不存在</p>
          <Button className='mt-4' asChild>
            <Link to='/admin/repositories'>返回仓库列表</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='container mx-auto space-y-6 py-6'>
      <div className='flex items-center justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link to='/admin/repositories/$repoId/jobs' params={{ repoId }}>
                <ArrowLeft className='mr-2 h-4 w-4' />
                返回任务列表
              </Link>
            </Button>
          </div>
          <h1 className='text-3xl font-bold'>任务详情 #{job.id.slice(0, 8)}</h1>
          {repository && (
            <p className='text-muted-foreground'>仓库: {repository.name}</p>
          )}
        </div>

        <Button variant='outline' size='sm' onClick={() => refetch()}>
          <RefreshCw className='mr-2 h-4 w-4' />
          刷新
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>任务状态</CardTitle>
          <CardDescription>索引任务的执行进度与阶段</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-wrap items-center gap-4'>
            <Badge variant={JOB_STATUS_CONFIG[job.status].variant}>
              {JOB_STATUS_CONFIG[job.status].label}
            </Badge>
            <span className='text-muted-foreground text-sm'>
              任务创建时间：
              {job.created_at
                ? new Date(job.created_at).toLocaleString('zh-CN')
                : '未知'}
            </span>
            <span className='text-muted-foreground text-sm'>
              耗时：
              {formatDuration(
                job.started_at ?? undefined,
                job.completed_at ?? undefined
              )}
            </span>
          </div>

          <Progress value={job.progress_percentage} className='h-2' />

          <JobStageIndicator
            currentStage={(() => {
              const history = job.result_summary?.stage_history ?? []
              const lastHistoryStage =
                history.length > 0
                  ? history[history.length - 1]?.stage
                  : undefined
              const summaryStage = (job.result_summary?.stage ||
                lastHistoryStage ||
                job.job_config?.stage) as JobStage | undefined
              return summaryStage ?? ('git_clone' as JobStage)
            })()}
            status={job.status}
          />
        </CardContent>
      </Card>

      {job.logs && job.logs.length > 0 && <JobLogViewer logs={job.logs} />}
    </div>
  )
}
