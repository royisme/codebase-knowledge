import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import type { Job, JobListResponse, JobStatus } from '@/types/job'
import { zhCN } from 'date-fns/locale'
import { Loader2, RefreshCw, ArrowLeft, XCircle, Trash2, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { listJobs, cancelJob, deleteJob, retryJob } from '@/lib/job-service'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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

const STAGE_LABELS: Record<string, string> = {
  git_clone: 'Git 克隆',
  file_scan: '文件扫描',
  code_parse: '代码解析',
  embedding: '向量化',
  graph_build: '图谱构建',
  completed: '完成',
}

export function JobListPage() {
  const { repoId } = useParams({ from: '/admin/repositories/$repoId/jobs' })
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [retryDialogOpen, setRetryDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const queryClient = useQueryClient()

  // 获取仓库信息
  const { data: repository } = useQuery({
    queryKey: ['repository', repoId],
    queryFn: () => getRepository(repoId),
  })

  // 获取任务列表
  const {
    data: jobs,
    isLoading,
    refetch,
    isError,
  } = useQuery<JobListResponse>({
    queryKey: ['jobs', repoId, statusFilter],
    queryFn: () =>
      listJobs({
        sourceId: repoId,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    refetchInterval: (query) => {
      // 如果有运行中的任务，每8秒轮询一次，减少后台压力
      const hasRunning = query.state.data?.items.some(
        (job: Job) => job.status === 'running'
      )
      return hasRunning ? 8000 : false
    },
  })

  // 取消任务
  const cancelMutation = useMutation({
    mutationFn: cancelJob,
    onSuccess: () => {
      toast.success('任务已取消')
      queryClient.invalidateQueries({ queryKey: ['jobs', repoId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '取消任务失败')
    },
  })

  // 删除任务
  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      toast.success('任务已删除')
      setDeleteDialogOpen(false)
      setSelectedJob(null)
      queryClient.invalidateQueries({ queryKey: ['jobs', repoId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除任务失败')
    },
  })

  // 重试任务
  const retryMutation = useMutation({
    mutationFn: retryJob,
    onSuccess: () => {
      toast.success('任务已重新提交')
      setRetryDialogOpen(false)
      setSelectedJob(null)
      queryClient.invalidateQueries({ queryKey: ['jobs', repoId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '重试任务失败')
    },
  })

  const handleCancelJob = (job: Job) => {
    setSelectedJob(job)
    setCancelDialogOpen(true)
  }

  const handleDeleteJob = (job: Job) => {
    setSelectedJob(job)
    setDeleteDialogOpen(true)
  }

  const handleRetryJob = (job: Job) => {
    setSelectedJob(job)
    setRetryDialogOpen(true)
  }

  useEffect(() => {
    if (isError) {
      toast.error('任务记录加载失败，请稍后重试')
    }
  }, [isError])

  const formatDuration = (job: Job) => {
    if (!job.started_at) return '-'

    const start = new Date(job.started_at)
    const end = job.completed_at ? new Date(job.completed_at) : new Date()
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000)

    if (seconds < 60) return `${seconds}秒`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-'
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: zhCN,
    })
  }

  return (
    <div className='container mx-auto space-y-6 py-6'>
      {/* 页面头部 */}
      <div className='flex items-center justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link to='/admin/repositories'>
                <ArrowLeft className='mr-2 h-4 w-4' />
                返回仓库列表
              </Link>
            </Button>
          </div>
          <h1 className='text-3xl font-bold'>任务列表</h1>
          {repository && (
            <p className='text-muted-foreground'>仓库: {repository.name}</p>
          )}
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className='mr-2 h-4 w-4' />
            刷新
          </Button>
        </div>
      </div>

      {/* 过滤器 */}
      <Card>
        <CardHeader>
          <CardTitle>过滤条件</CardTitle>
          <CardDescription>根据状态筛选任务</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-4'>
            <label className='text-sm font-medium'>任务状态:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-[200px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>全部</SelectItem>
                <SelectItem value='running'>运行中</SelectItem>
                <SelectItem value='completed'>已完成</SelectItem>
                <SelectItem value='failed'>失败</SelectItem>
                <SelectItem value='pending'>待处理</SelectItem>
                <SelectItem value='cancelled'>已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 任务表格 */}
      <Card>
        <CardHeader>
          <CardTitle>任务记录 {jobs && `(${jobs.total} 条)`}</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <ErrorState
              title='无法加载任务记录'
              description='请刷新页面或稍后再试，若问题持续请联系平台团队。'
              onRetry={() => refetch()}
            />
          ) : isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
            </div>
          ) : jobs?.items.length === 0 ? (
            <div className='text-muted-foreground py-12 text-center'>
              暂无任务记录
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务 ID</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>阶段</TableHead>
                  <TableHead>进度</TableHead>
                  <TableHead>开始时间</TableHead>
                  <TableHead>耗时</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs?.items.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className='font-mono text-xs'>
                      {job.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={JOB_STATUS_CONFIG[job.status].variant}>
                        {JOB_STATUS_CONFIG[job.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const history = job.result_summary?.stage_history ?? []
                        const lastHistoryStage =
                          history.length > 0
                            ? history[history.length - 1]?.stage
                            : undefined
                        const summaryStage =
                          job.result_summary?.stage || lastHistoryStage
                        const stageKey = summaryStage || job.job_config?.stage
                        if (!stageKey) return '-'
                        return STAGE_LABELS[stageKey] ?? stageKey
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <div className='bg-secondary h-2 w-20 rounded-full'>
                          <div
                            className='bg-primary h-2 rounded-full transition-all'
                            style={{ width: `${job.progress_percentage}%` }}
                          />
                        </div>
                        <span className='text-muted-foreground text-sm'>
                          {job.progress_percentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatTime(job.started_at)}</TableCell>
                    <TableCell>{formatDuration(job)}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        {/* 查看详情 */}
                        <Button variant='ghost' size='sm' asChild>
                          <Link
                            to='/admin/repositories/$repoId/jobs/$jobId'
                            params={{ repoId, jobId: job.id }}
                          >
                            详情
                          </Link>
                        </Button>

                        {/* 取消任务 - 仅 pending 和 running 状态可用 */}
                        {(job.status === 'pending' || job.status === 'running') && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleCancelJob(job)}
                            disabled={cancelMutation.isPending}
                            title='取消任务'
                          >
                            <XCircle className='h-4 w-4' />
                          </Button>
                        )}

                        {/* 重试任务 - 仅 failed 和 cancelled 状态可用 */}
                        {(job.status === 'failed' || job.status === 'cancelled') && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleRetryJob(job)}
                            disabled={retryMutation.isPending}
                            title='重试任务'
                          >
                            <RotateCw className='h-4 w-4' />
                          </Button>
                        )}

                        {/* 删除任务 - 仅非运行状态可用 */}
                        {job.status !== 'running' && job.status !== 'pending' && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleDeleteJob(job)}
                            disabled={deleteMutation.isPending}
                            title='删除任务'
                          >
                            <Trash2 className='h-4 w-4 text-destructive' />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除任务 <code className='font-mono'>{selectedJob?.id.slice(0, 8)}</code> 吗？
              此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedJob && deleteMutation.mutate(selectedJob.id)}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 取消确认对话框 */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认取消任务</AlertDialogTitle>
            <AlertDialogDescription>
              确定要取消任务 <code className='font-mono'>{selectedJob?.id.slice(0, 8)}</code> 吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedJob) {
                  cancelMutation.mutate(selectedJob.id)
                  setCancelDialogOpen(false)
                  setSelectedJob(null)
                }
              }}
            >
              确认取消
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 重试确认对话框 */}
      <AlertDialog open={retryDialogOpen} onOpenChange={setRetryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认重试任务</AlertDialogTitle>
            <AlertDialogDescription>
              确定要重试任务 <code className='font-mono'>{selectedJob?.id.slice(0, 8)}</code> 吗？
              任务将被重新提交到队列。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedJob && retryMutation.mutate(selectedJob.id)}
            >
              确认重试
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
