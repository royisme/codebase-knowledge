import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import {
  Search as SearchIcon,
  SlidersHorizontal,
  Download,
  RefreshCw,
  Clock,
  User,
  Activity as ActivityIcon,
  Shield,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { fetchAuditLogs, type AuditLogEntry } from '@/lib/rbac-service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ErrorState } from '@/components/ui/error-state'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/layout/page-header'

type AuditStatus = AuditLogEntry['status']
type AuditAction =
  | 'assign_role'
  | 'update_policy'
  | 'create_policy'
  | 'delete_policy'
  | 'login_attempt'
  | 'permission_denied'

const ACTION_OPTIONS: readonly AuditAction[] = [
  'assign_role',
  'update_policy',
  'create_policy',
  'delete_policy',
  'login_attempt',
  'permission_denied',
] as const

const STATUS_OPTIONS: ReadonlyArray<{
  value: AuditStatus
  label: string
  variant: 'default' | 'destructive'
}> = [
  { value: 'success', label: '成功', variant: 'default' },
  { value: 'failure', label: '失败', variant: 'destructive' },
]

const STATUS_LABELS: Record<AuditStatus, string> = {
  success: '成功',
  failure: '失败',
}

const ACTION_LABELS: Record<string, string> = {
  assign_role: '分配角色',
  update_policy: '更新策略',
  create_policy: '创建策略',
  delete_policy: '删除策略',
  login_attempt: '登录尝试',
  permission_denied: '权限不足',
}

const STATUS_ICONS: Record<AuditStatus, React.ReactNode> = {
  success: <Shield className='h-4 w-4' />,
  failure: <AlertCircle className='h-4 w-4' />,
}

const route = getRouteApi('/admin/audit')

export function AuditPage() {
  const searchParams = route.useSearch()
  const navigate = route.useNavigate()

  const pageSize = 20

  const {
    data: auditResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery<{
    audits: AuditLogEntry[]
    total: number
    page: number
    limit: number
  }>({
    queryKey: ['rbac', 'audits'],
    queryFn: fetchAuditLogs,
  })

  useEffect(() => {
    if (isError) {
      toast.error('审计日志加载失败，请稍后再试')
    }
  }, [isError])

  // 从路由参数获取过滤条件
  const search = searchParams.search ?? ''
  const statusFilters = useMemo<AuditStatus[]>(
    () => searchParams.statuses ?? [],
    [searchParams.statuses]
  )
  const actionFilters = useMemo<AuditAction[]>(
    () => searchParams.actions ?? [],
    [searchParams.actions]
  )
  const page = searchParams.page ?? 1

  // Mock 分页和过滤逻辑
  const filteredAudits = useMemo(() => {
    const audits = auditResponse?.audits ?? []
    if (!audits) return { items: [], total: 0 }

    const filtered = audits.filter((audit: AuditLogEntry) => {
      // 搜索过滤
      if (search) {
        const searchLower = search.toLowerCase()
        if (
          !audit.actor.toLowerCase().includes(searchLower) &&
          !audit.action.toLowerCase().includes(searchLower) &&
          !audit.target.toLowerCase().includes(searchLower) &&
          !(audit.details?.toLowerCase().includes(searchLower) || false)
        ) {
          return false
        }
      }

      // 状态过滤
      if (statusFilters.length > 0 && !statusFilters.includes(audit.status)) {
        return false
      }

      // 动作过滤
      if (
        actionFilters.length > 0 &&
        !actionFilters.includes(audit.action as AuditAction)
      ) {
        return false
      }

      return true
    })

    // Mock 分页
    const startIndex = (page - 1) * pageSize
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize)

    return {
      items: paginatedItems,
      total: filtered.length,
    }
  }, [
    auditResponse?.audits,
    search,
    statusFilters,
    actionFilters,
    page,
    pageSize,
  ])

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getStatusBadge = (status: AuditStatus) => {
    const statusOption = STATUS_OPTIONS.find(
      (option) => option.value === status
    )
    if (!statusOption) return null

    return (
      <Badge variant={statusOption.variant} className='flex items-center gap-1'>
        {STATUS_ICONS[status]}
        {STATUS_LABELS[status]}
      </Badge>
    )
  }

  const getActionLabel = (action: string) => {
    return ACTION_LABELS[action] || action
  }

  const handleExport = () => {
    toast.info('导出功能开发中...')
  }

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <PageHeader
          title='审计日志'
          description='查看系统操作审计记录'
          icon={<ActivityIcon className='h-6 w-6' />}
          breadcrumbs={[
            { label: '系统管理', href: '/admin' },
            { label: '审计日志' },
          ]}
          actions={
            <>
              <Button variant='outline'>
                <Download className='mr-2 h-4 w-4' />
                导出
              </Button>
              <Button variant='outline' size='icon'>
                <RefreshCw className='h-4 w-4' />
              </Button>
            </>
          }
        />
        <Card>
          <CardHeader>
            <div className='flex space-x-4'>
              <Skeleton className='h-10 w-64' />
              <Skeleton className='h-10 w-32' />
              <Skeleton className='h-10 w-32' />
              <Skeleton className='h-10 w-24' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className='h-16 w-full' />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title='无法加载审计日志'
        description='请刷新页面或稍后再试，若问题持续请联系平台团队。'
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='审计日志'
        description='查看系统操作审计记录'
        icon={<ActivityIcon className='h-6 w-6' />}
        breadcrumbs={[
          { label: '系统管理', href: '/admin' },
          { label: '审计日志' },
        ]}
        actions={
          <>
            <Button variant='outline' onClick={handleExport}>
              <Download className='mr-2 h-4 w-4' />
              导出
            </Button>
            <Button variant='outline' size='icon' onClick={() => refetch()}>
              <RefreshCw className='h-4 w-4' />
            </Button>
          </>
        }
      />

      {/* 搜索和筛选区域 */}
      <Card>
        <CardHeader>
          <div className='flex flex-wrap items-center gap-2'>
            <div className='relative max-w-md flex-1'>
              <SearchIcon className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                value={search}
                onChange={(event) => {
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      search: event.target.value,
                      page: 1,
                    }),
                  })
                }}
                placeholder='搜索操作人、动作或目标'
                className='pl-9'
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline'>
                  <SlidersHorizontal className='mr-2 h-4 w-4' />
                  状态筛选
                  {statusFilters.length > 0 && (
                    <Badge variant='secondary' className='ml-2'>
                      {statusFilters.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start'>
                <DropdownMenuLabel>筛选状态</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STATUS_OPTIONS.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={statusFilters.includes(option.value)}
                    onCheckedChange={() => {
                      navigate({
                        search: (prev) => {
                          const prevStatuses = (prev.statuses ??
                            []) as AuditStatus[]
                          const newFilters: AuditStatus[] =
                            prevStatuses.includes(option.value)
                              ? prevStatuses.filter(
                                  (item) => item !== option.value
                                )
                              : [...prevStatuses, option.value]
                          return { ...prev, statuses: newFilters, page: 1 }
                        },
                      })
                    }}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    navigate({
                      search: (prev) => ({ ...prev, statuses: [], page: 1 }),
                    })
                  }}
                >
                  重置筛选
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline'>
                  <ActivityIcon className='mr-2 h-4 w-4' />
                  动作筛选
                  {actionFilters.length > 0 && (
                    <Badge variant='secondary' className='ml-2'>
                      {actionFilters.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start'>
                <DropdownMenuLabel>筛选动作</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ACTION_OPTIONS.map((action) => (
                  <DropdownMenuCheckboxItem
                    key={action}
                    checked={actionFilters.includes(action)}
                    onCheckedChange={() => {
                      navigate({
                        search: (prev) => {
                          const prevActions = (prev.actions ??
                            []) as AuditAction[]
                          const newFilters: AuditAction[] =
                            prevActions.includes(action)
                              ? prevActions.filter((item) => item !== action)
                              : [...prevActions, action]
                          return { ...prev, actions: newFilters, page: 1 }
                        },
                      })
                    }}
                  >
                    {getActionLabel(action)}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    navigate({
                      search: (prev) => ({ ...prev, actions: [], page: 1 }),
                    })
                  }}
                >
                  重置筛选
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Input type='date' placeholder='开始日期' className='w-40' />

            <Input type='date' placeholder='结束日期' className='w-40' />
          </div>
        </CardHeader>
      </Card>

      {/* 审计日志列表 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span>审计记录</span>
            <div className='text-muted-foreground text-sm font-normal'>
              共 {filteredAudits.total} 条记录 · 第 {page} 页
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAudits.items.length === 0 ? (
            <div className='py-12 text-center'>
              <Clock className='text-muted-foreground mx-auto h-12 w-12' />
              <h3 className='text-foreground mt-2 text-sm font-semibold'>
                暂无审计记录
              </h3>
              <p className='text-muted-foreground mt-1 text-sm'>
                {search || statusFilters.length > 0 || actionFilters.length > 0
                  ? '没有找到符合条件的审计记录，请尝试调整搜索条件或筛选器。'
                  : '还没有审计记录。'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>操作人</TableHead>
                    <TableHead>动作</TableHead>
                    <TableHead>目标</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>详情</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAudits.items.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell>
                        <div className='text-sm'>
                          {formatDate(audit.timestamp)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center space-x-2'>
                          {audit.actor === 'system' ? (
                            <>
                              <ActivityIcon className='text-primary h-4 w-4' />
                              <span className='text-muted-foreground font-medium'>
                                系统
                              </span>
                            </>
                          ) : (
                            <>
                              <User className='text-muted-foreground h-4 w-4' />
                              <span className='font-medium'>{audit.actor}</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>
                          {ACTION_LABELS[audit.action] || audit.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className='max-w-xs truncate' title={audit.target}>
                          {audit.target}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(audit.status)}</TableCell>
                      <TableCell>
                        {audit.details && (
                          <div
                            className='text-muted-foreground max-w-xs truncate text-sm'
                            title={audit.details}
                          >
                            {audit.details}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 分页 */}
              <div className='flex items-center justify-between pt-4'>
                <div className='text-muted-foreground text-sm'>
                  共 {filteredAudits.total} 条记录 · 第 {page} 页
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={page <= 1}
                    onClick={() =>
                      navigate({
                        search: (prev) => ({
                          ...prev,
                          page: Math.max(1, page - 1),
                        }),
                      })
                    }
                  >
                    上一页
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={page * pageSize >= filteredAudits.total}
                    onClick={() =>
                      navigate({
                        search: (prev) => ({
                          ...prev,
                          page: Math.min(
                            page + 1,
                            Math.ceil(filteredAudits.total / pageSize)
                          ),
                        }),
                      })
                    }
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
