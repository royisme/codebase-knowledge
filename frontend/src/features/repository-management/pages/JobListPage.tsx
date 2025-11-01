import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, RefreshCw, ArrowLeft } from 'lucide-react'
import { listJobs } from '@/lib/job-service'
import { getRepository } from '@/lib/repository-service'
import type { Job, JobStatus } from '@/types/job'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

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

export function JobListPage() {
  const { repoId } = useParams({ from: '/admin/repositories/$repoId/jobs' })
  const [statusFilter, setStatusFilter] = useState<string>('all')

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
  } = useQuery({
    queryKey: ['jobs', repoId, statusFilter],
    queryFn: () =>
      listJobs({
        source_id: repoId,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    refetchInterval: (query) => {
      // 如果有运行中的任务，每3秒轮询一次
      const hasRunning = query.state.data?.items.some((job: Job) => job.status === 'running')
      return hasRunning ? 3000 : false
    },
  })

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
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/repositories">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回仓库列表
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">任务列表</h1>
          {repository && (
            <p className="text-muted-foreground">
              仓库: {repository.name}
            </p>
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
        </div>
      </div>

      {/* 过滤器 */}
      <Card>
        <CardHeader>
          <CardTitle>过滤条件</CardTitle>
          <CardDescription>根据状态筛选任务</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">任务状态:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="running">运行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 任务表格 */}
      <Card>
        <CardHeader>
          <CardTitle>
            任务记录 {jobs && `(${jobs.total} 条)`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : jobs?.items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
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
                    <TableCell className="font-mono text-xs">
                      {job.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={JOB_STATUS_CONFIG[job.status].variant}>
                        {JOB_STATUS_CONFIG[job.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {job.job_config?.stage || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${job.progress_percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {job.progress_percentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatTime(job.started_at)}</TableCell>
                    <TableCell>{formatDuration(job)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          to="/admin/repositories/$repoId/jobs/$jobId"
                          params={{ repoId, jobId: job.id }}
                        >
                          查看详情
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
