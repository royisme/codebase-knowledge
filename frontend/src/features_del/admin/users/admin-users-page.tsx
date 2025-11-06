import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { AdminUser, AdminUserListResponse, UserStatus } from '@/types'
import {
  RefreshCw,
  Search as SearchIcon,
  SlidersHorizontal,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  listAdminUsers,
  resetUserPassword,
  updateUserStatus,
} from '@/lib/admin-users-service'
import { ActionMenu } from '@/components/ui/action-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/layout/page-header'

type AdminUsersSearchParams = {
  page?: number
  pageSize?: number
  search?: string
  statuses?: UserStatus[]
}

const route = getRouteApi('/admin/users')

const STATUS_OPTIONS: Array<{ value: UserStatus; label: string }> = [
  { value: 'active', label: '活跃' },
  { value: 'unverified', label: '未验证' },
  { value: 'suspended', label: '已停用' },
]

type UserAction =
  | { type: 'reset_password'; user: AdminUser }
  | { type: 'change_status'; user: AdminUser; newStatus: UserStatus }
  | null

export function AdminUsersPage() {
  const routeSearchParams = route.useSearch() as AdminUsersSearchParams
  const navigate = route.useNavigate()

  const [userAction, setUserAction] = useState<UserAction>(null)
  const queryClient = useQueryClient()

  // 使用 deferred value 优化搜索输入
  const deferredSearch = useDeferredValue(routeSearchParams.search || '')
  const page = routeSearchParams.page || 1
  const pageSize = routeSearchParams.pageSize || 10
  const statusFilters = useMemo(
    () => routeSearchParams.statuses || [],
    [routeSearchParams.statuses]
  )

  const queryKey = useMemo(() => {
    const normalizedStatuses = [...statusFilters].sort().join(',')
    return [
      'admin',
      'users',
      { page, pageSize, search: deferredSearch, statuses: normalizedStatuses },
    ]
  }, [page, pageSize, deferredSearch, statusFilters])

  const usersQuery = useQuery<AdminUserListResponse>({
    queryKey,
    queryFn: () =>
      listAdminUsers({
        page,
        pageSize,
        search: deferredSearch,
        statuses: statusFilters.length > 0 ? statusFilters : undefined,
      }),
    placeholderData: (previous) => previous,
  })

  useEffect(() => {
    if (usersQuery.isError) {
      toast.error('用户列表加载失败，请稍后重试')
    }
  }, [usersQuery.isError])

  const resetPasswordMutation = useMutation({
    mutationFn: resetUserPassword,
    onSuccess: (response) => {
      toast.success(`临时密码: ${response.temporaryPassword}`)
      setUserAction(null)
    },
    onError: () => {
      toast.error('重置密码失败')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: updateUserStatus,
    onSuccess: () => {
      toast.success('用户状态已更新')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setUserAction(null)
    },
    onError: () => {
      toast.error('更新用户状态失败')
    },
  })

  const isMutating =
    resetPasswordMutation.isPending || updateStatusMutation.isPending

  const updateSearchParam = (updates: Partial<AdminUsersSearchParams>) => {
    navigate({
      search: (prev: AdminUsersSearchParams) => ({ ...prev, ...updates }),
    })
  }

  const toggleStatusFilter = (status: UserStatus) => {
    const newFilters = statusFilters.includes(status)
      ? statusFilters.filter((item: UserStatus) => item !== status)
      : [...statusFilters, status]

    updateSearchParam({
      statuses: newFilters,
      page: 1,
    })
  }

  const resetFilters = () => {
    updateSearchParam({
      search: '',
      statuses: [],
      page: 1,
    })
  }

  const handleUserAction = (action: UserAction) => {
    setUserAction(action)
  }

  const handleConfirmAction = async () => {
    if (!userAction) return

    try {
      switch (userAction.type) {
        case 'reset_password':
          await resetPasswordMutation.mutateAsync({
            userId: userAction.user.id,
          })
          break
        case 'change_status':
          await updateStatusMutation.mutateAsync({
            userId: userAction.user.id,
            status: userAction.newStatus,
          })
          break
      }
    } catch {
      // 错误处理已在 mutations 中完成
    }
  }

  return (
    <div className='space-y-6'>
      {/* 页面标题 */}
      <PageHeader
        title='用户管理'
        description='管理系统用户、分配角色和查看用户活动'
        icon={<User className='h-6 w-6' />}
      />

      {/* 搜索和筛选区域 */}
      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative w-full max-w-md'>
          <SearchIcon className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            value={routeSearchParams.search || ''}
            onChange={(event) => {
              updateSearchParam({
                search: event.target.value,
                page: 1,
              })
            }}
            placeholder='搜索用户名称或邮箱'
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
                onCheckedChange={() => toggleStatusFilter(option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem inset onSelect={resetFilters}>
              重置筛选
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          onClick={() => void usersQuery.refetch()}
          variant='ghost'
          size='icon'
          className='ml-auto'
        >
          <RefreshCw className='h-4 w-4' />
        </Button>
      </div>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>用户管理</CardTitle>
          <CardDescription>
            管理系统用户、分配角色和查看用户活动
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersQuery.isError ? (
            <ErrorState
              title='无法加载用户列表'
              description='请检查网络连接或稍后再试，如持续报错请联系平台团队。'
              onRetry={() => void usersQuery.refetch()}
            />
          ) : usersQuery.isLoading ? (
            <div className='space-y-4'>
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className='flex items-center space-x-4 border-b p-4'
                >
                  <Skeleton className='h-10 w-10 rounded-full' />
                  <div className='flex-1 space-y-2'>
                    <Skeleton className='h-4 w-48' />
                    <Skeleton className='h-3 w-64' />
                  </div>
                  <Skeleton className='h-8 w-20' />
                  <Skeleton className='h-8 w-8' />
                </div>
              ))}
            </div>
          ) : (
            <div className='space-y-4'>
              {usersQuery.data?.items.length === 0 ? (
                <div className='py-12 text-center'>
                  <User className='text-muted-foreground mx-auto h-12 w-12' />
                  <h3 className='text-foreground mt-2 text-sm font-semibold'>
                    暂无用户
                  </h3>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    {deferredSearch || statusFilters.length > 0
                      ? '没有找到符合条件的用户，请尝试调整搜索条件或筛选器。'
                      : '还没有用户，请先添加用户。'}
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>用户</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>角色</TableHead>
                        <TableHead>最近登录</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead className='text-right'>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersQuery.data?.items.map((user) => (
                        <UserRow
                          key={user.id}
                          user={user}
                          onAction={handleUserAction}
                          isMutating={isMutating}
                        />
                      ))}
                    </TableBody>
                  </Table>

                  {/* 分页 */}
                  <div className='flex items-center justify-between pt-4'>
                    <div className='text-muted-foreground text-sm'>
                      共 {usersQuery.data?.total || 0} 条记录 · 第 {page} 页
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        disabled={page <= 1 || isMutating}
                        onClick={() => updateSearchParam({ page: page - 1 })}
                      >
                        上一页
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        disabled={
                          !usersQuery.data ||
                          page >= Math.ceil(usersQuery.data.total / pageSize) ||
                          isMutating
                        }
                        onClick={() => updateSearchParam({ page: page + 1 })}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 确认对话框 */}
      <ConfirmDialog
        open={Boolean(userAction)}
        onOpenChange={(open) => {
          if (!open) setUserAction(null)
        }}
        title={
          userAction?.type === 'reset_password'
            ? '重置密码'
            : userAction?.type === 'change_status'
              ? `${userAction.newStatus === 'active' ? '激活' : '停用'}用户`
              : ''
        }
        desc={
          userAction?.type === 'reset_password'
            ? `确认重置用户 ${userAction.user.displayName} 的密码？`
            : userAction?.type === 'change_status'
              ? `确认${userAction.newStatus === 'active' ? '激活' : '停用'}用户 ${userAction.user.displayName}？`
              : ''
        }
        confirmText='确认'
        cancelBtnText='取消'
        destructive={
          userAction?.type === 'change_status' &&
          userAction.newStatus !== 'active'
        }
        handleConfirm={() => void handleConfirmAction()}
        isLoading={isMutating}
      />
    </div>
  )
}

interface UserRowProps {
  user: AdminUser
  onAction: (action: UserAction) => void
  isMutating: boolean
}

function UserRow({ user, onAction, isMutating }: UserRowProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      active: 'default',
      unverified: 'outline',
      suspended: 'destructive',
    }
    const labels: Record<string, string> = {
      active: '活跃',
      unverified: '未验证',
      suspended: '已停用',
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '从未'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <TableRow>
      <TableCell>
        <div className='flex items-center space-x-3'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={user.avatar} alt={user.displayName} />
            <AvatarFallback>
              {user.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className='font-medium'>{user.displayName}</div>
            <div className='text-muted-foreground text-sm'>{user.email}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(user.status)}</TableCell>
      <TableCell>
        <Badge variant='outline'>
          {user.roleIds && user.roleIds.length > 0 ? user.roleIds[0] : '未配置'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className='text-muted-foreground text-sm'>
          {formatDate(user.lastLoginAt)}
        </div>
      </TableCell>
      <TableCell>
        <div className='text-muted-foreground text-sm'>
          {formatDate(user.createdAt)}
        </div>
      </TableCell>
      <TableCell className='text-right'>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: '重置密码',
                  onSelect: () => onAction({ type: 'reset_password', user }),
                },
                {
                  label: user.status === 'active' ? '停用用户' : '激活用户',
                  onSelect: () =>
                    onAction({
                      type: 'change_status',
                      user,
                      newStatus:
                        user.status === 'active' ? 'suspended' : 'active',
                    }),
                  destructive: user.status === 'active',
                },
              ],
            },
          ]}
          triggerLabel={`操作 ${user.displayName}`}
          disabled={isMutating}
        />
      </TableCell>
    </TableRow>
  )
}
