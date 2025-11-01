import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  RefreshCw,
  XCircle,
  RotateCcw,
  Loader2,
} from 'lucide-react'
import { getJobDetail, cancelJob, retryJob } from '@/lib/job-service'
import { getRepository } from '@/lib/repository-service'
import { JobStageIndicator } from '../components/JobStageIndicator'
import { JobLogViewer } from '../components/JobLogViewer'
import type { JobStatus } from '@/types/job'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const JOB_STATUS_CONFIG: Record<
  JobStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  pending: { label: '待处理', variant: 'secondary' },
  running: { label: '运行中', variant: 'default' },
  completed: { label: '已完成', variant: 'outline' },
  failed: { label: '失败', variant: 'destructive' },
  cancelled: { label: '已取消', variant: 'secondary' },
}

export function JobDetailPage() {
  const { repoId, jobId } = useParams({
    from: '/admin/repositories/$repoId/jobs/$jobId',
  })
  const queryClient = useQueryClient()

  // 获取仓库信息
  const { data: repository } = useQuery({
    queryKey: ['repository', repoId],
    queryFn: () => getRepository(repoId),
  })

  // 获取任务详情
  const {
    data: job,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJobDetail(jobId),
    refetchInterval: (query) => {
      // 如果任务正在运行，每3秒轮询一次
      return query.state.data?.status === 'running' ? 3000 : false
    },
  })

  // 取消任务
  const cancelMutation = useMutation({
    mutationFn: () => cancelJob(jobId),
    onSuccess: () => {
      toast.success('任务已取消')
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (error: Error) => {
      toast.error(`取消失败: ${error.message}`)
    },
  })

  // 重试任务
  const retryMutation = useMutation({
    mutationFn: () => retryJob(jobId),
    onSuccess: () => {
      toast.success('已触发重试，新任务已创建')
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (error: Error) => {
      toast.error(`重试失败: ${error.message}`)
    },
  })

  const formatDuration = () => {
    if (!job?.started_at) return '-'

    const start = new Date(job.started_at)
    const end = job.completed_at ? new Date(job.completed_at) : new Date()
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000)

    if (seconds < 60) return `${seconds}秒`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-muted-foreground">任务不存在</p>
          <Button className="mt-4" asChild>
            <Link to="/admin/repositories">返回仓库列表</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/repositories/$repoId/jobs" params={{ repoId }}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回任务列表
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">
            任务详情 #{job.id.slice(0, 8)}
          </h1>
          {repository && (
            <p className="text-muted-foreground">仓库: {repository.name}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>

          {job.status === 'running' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={cancelMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  取消任务
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认取消任务？</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将中止正在运行的索引任务。已处理的数据可能丢失，您确定要继续吗？
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => cancelMutation.mutate()}
                    className="bg-destructive text-destructive-foreground"
                  >
                    确认取消任务
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {job.status === 'failed' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  disabled={retryMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重试任务
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>重试索引任务？</AlertDialogTitle>
                  <AlertDialogDescription>
                    这将创建一个新的任务重新开始索引流程。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={() => retryMutation.mutate()}>
                    确认重试
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：任务信息 */}
        <div className="space-y-6">
          {/* 状态卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>任务状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">当前状态</p>
                <Badge variant={JOB_STATUS_CONFIG[job.status].variant} className="text-sm">
                  {JOB_STATUS_CONFIG[job.status].label}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">总体进度</p>
                <div className="space-y-2">
                  <Progress value={job.progress_percentage} />
                  <p className="text-sm text-right">{job.progress_percentage}%</p>
                </div>
              </div>

              {job.error_message && (
                <div className="rounded-md bg-destructive/10 p-4">
                  <p className="text-sm font-medium text-destructive">
                    错误信息
                  </p>
                  <p className="text-sm text-destructive/80 mt-1">
                    {job.error_message}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 统计信息 */}
          <Card>
            <CardHeader>
              <CardTitle>统计信息</CardTitle>
              <CardDescription>索引处理统计</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">已处理项目</dt>
                  <dd className="text-2xl font-bold">
                    {job.items_processed || 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">总项目数</dt>
                  <dd className="text-2xl font-bold">
                    {job.total_items || '-'}
                  </dd>
                </div>
                {job.result_summary && (
                  <>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        文件扫描
                      </dt>
                      <dd className="text-lg font-semibold">
                        {job.result_summary.files_scanned || 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        文件解析
                      </dt>
                      <dd className="text-lg font-semibold">
                        {job.result_summary.files_parsed || 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        解析失败
                      </dt>
                      <dd className="text-lg font-semibold text-destructive">
                        {job.result_summary.files_failed || 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        函数提取
                      </dt>
                      <dd className="text-lg font-semibold">
                        {job.result_summary.functions_extracted || 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        图节点
                      </dt>
                      <dd className="text-lg font-semibold">
                        {job.result_summary.nodes_created || 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        图边
                      </dt>
                      <dd className="text-lg font-semibold">
                        {job.result_summary.edges_created || 0}
                      </dd>
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <dt className="text-sm text-muted-foreground">耗时</dt>
                  <dd className="text-lg font-semibold">{formatDuration()}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* 阶段进度 */}
          <Card>
            <CardHeader>
              <CardTitle>执行阶段</CardTitle>
              <CardDescription>当前任务的执行进度</CardDescription>
            </CardHeader>
            <CardContent>
              {job.job_config?.stage ? (
                <JobStageIndicator
                  currentStage={job.job_config.stage}
                  status={job.status}
                />
              ) : (
                <p className="text-sm text-muted-foreground">暂无阶段信息</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：实时日志 */}
        <div>
          <JobLogViewer logs={job.logs || []} />
        </div>
      </div>
    </div>
  )
}
