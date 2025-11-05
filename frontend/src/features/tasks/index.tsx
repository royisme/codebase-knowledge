import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import type {
  QueueTask,
  QueueTaskListResponse,
  QueueTaskStatus,
} from '@/types/tasks'
import { zhCN } from 'date-fns/locale'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { listTasks } from '@/lib/task-service'
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

const STATUS_OPTIONS: Array<{ value: QueueTaskStatus | 'all'; label: string }> =
  [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待处理' },
    { value: 'processing', label: '执行中' },
    { value: 'success', label: '已完成' },
    { value: 'failed', label: '失败' },
    { value: 'cancelled', label: '已取消' },
  ]

const STATUS_BADGE: Record<
  QueueTaskStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'outline' | 'destructive'
  }
> = {
  pending: { label: '待处理', variant: 'secondary' },
  processing: { label: '执行中', variant: 'default' },
  success: { label: '已完成', variant: 'outline' },
  failed: { label: '失败', variant: 'destructive' },
  cancelled: { label: '已取消', variant: 'secondary' },
}

const formatTime = (dateString?: string | null) => {
  if (!dateString) return '-'
  return formatDistanceToNow(new Date(dateString), {
    addSuffix: true,
    locale: zhCN,
  })
}

export function Tasks() {
  const [statusFilter, setStatusFilter] = useState<QueueTaskStatus | 'all'>(
    'all'
  )

  const tasksQuery = useQuery<QueueTaskListResponse>({
    queryKey: ['admin', 'tasks', statusFilter],
    queryFn: () =>
      listTasks({
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    refetchInterval: (query) => {
      const hasProcessing = query.state.data?.tasks.some(
        (task: QueueTask) => task.status === 'processing'
      )
      return hasProcessing ? 5000 : false
    },
  })

  const { data, isLoading, refetch, isError } = tasksQuery

  useEffect(() => {
    if (tasksQuery.isError) {
      toast.error('任务列表加载失败，请稍后重试')
    }
  }, [tasksQuery.isError])

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-3xl font-bold'>任务中心</h1>
          <p className='text-muted-foreground text-sm'>
            查看后端异步任务队列的运行状态
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as QueueTaskStatus | 'all')
            }
          >
            <SelectTrigger className='w-32'>
              <SelectValue placeholder='任务状态' />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      <Card>
        <CardHeader>
          <CardTitle>任务队列</CardTitle>
          <CardDescription>
            {statusFilter === 'all'
              ? '显示最近的任务记录，执行中的任务会自动刷新。'
              : `当前筛选：${STATUS_OPTIONS.find((item) => item.value === statusFilter)?.label}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError ? (
            <ErrorState
              title='无法加载任务列表'
              description='请刷新页面或稍后再试，若长期失败请联系平台团队。'
              onRetry={() => refetch()}
            />
          ) : isLoading ? (
            <div className='flex h-48 items-center justify-center'>
              <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
            </div>
          ) : !data || data.tasks.length === 0 ? (
            <div className='text-muted-foreground py-12 text-center'>
              暂无任务记录
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>任务 ID</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>进度</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>开始时间</TableHead>
                    <TableHead>完成时间</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.tasks.map((task) => (
                    <TableRow key={task.task_id}>
                      <TableCell className='font-mono text-xs'>
                        {task.task_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[task.status].variant}>
                          {STATUS_BADGE[task.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{Math.round(task.progress * 100)}%</TableCell>
                      <TableCell>{formatTime(task.created_at)}</TableCell>
                      <TableCell>{formatTime(task.started_at)}</TableCell>
                      <TableCell>{formatTime(task.completed_at)}</TableCell>
                      <TableCell className='text-muted-foreground max-w-xs truncate text-sm'>
                        {task.message || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
