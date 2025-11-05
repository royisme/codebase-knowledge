import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Repository,
  RepositoryListResponse,
  RepositoryStatus,
} from '@/types/repository'
import {
  Plus,
  RefreshCw,
  Search as SearchIcon,
  GitBranch,
  SlidersHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ApiClientError } from '@/lib/api-client'
import {
  listRepositories,
  deleteRepository,
  triggerIndex,
} from '@/lib/repository-service'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ErrorState } from '@/components/ui/error-state'
import { Input } from '@/components/ui/input'
import { ServerPagination } from '@/components/ui/server-pagination'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { AddRepositoryDialog } from '../components/AddRepositoryDialog'
import { EditRepositoryDialog } from '../components/EditRepositoryDialog'
import { RepositoriesTable } from '../components/RepositoriesTable'

const statusOptions: Array<{ value: RepositoryStatus; label: string }> = [
  { value: 'indexed', label: '已索引' },
  { value: 'indexing', label: '索引中' },
  { value: 'pending_index', label: '待索引' },
  { value: 'failed', label: '失败' },
  { value: 'pending', label: '待验证' },
]

type ConfirmAction =
  | { type: 'delete'; repo: Repository }
  | { type: 'triggerIndex'; repo: Repository; forceFull: boolean }
  | null

export function RepositoryListPage() {
  const [isAddDialogOpen, setAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<RepositoryStatus[]>(
    []
  )
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [editingRepo, setEditingRepo] = useState<Repository | null>(null)
  const [isEditDialogOpen, setEditDialogOpen] = useState(false)

  const deferredSearch = useDeferredValue(searchQuery)

  const queryClient = useQueryClient()

  // 获取仓库列表
  const { data, isLoading, refetch, isError } =
    useQuery<RepositoryListResponse>({
      queryKey: [
        'repositories',
        {
          statuses: selectedStatuses,
          search: deferredSearch,
          page: currentPage,
          size: pageSize,
        },
      ],
      queryFn: () =>
        listRepositories({
          statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
          search: deferredSearch || undefined,
          page: currentPage,
          pageSize: pageSize,
        }),
    })

  useEffect(() => {
    if (isError) {
      toast.error('仓库列表加载失败，请稍后重试')
    }
  }, [isError])

  // 删除仓库
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRepository(id),
    onSuccess: () => {
      toast.success('仓库已删除')
      void queryClient.invalidateQueries({ queryKey: ['repositories'] })
      setConfirmAction(null)
    },
    onError: () => {
      toast.error('删除失败，请重试')
    },
  })

  // 触发索引
  const triggerIndexMutation = useMutation({
    mutationFn: ({ id, forceFull }: { id: string; forceFull: boolean }) =>
      triggerIndex(id, { force_full: forceFull }),
    onSuccess: (data) => {
      const jobInfo = data.job_id ? `（ID: ${data.job_id.slice(0, 8)}）` : ''
      toast.success(`${data.message ?? '索引任务已创建'}${jobInfo}`)
      void queryClient.invalidateQueries({ queryKey: ['repositories'] })
      setConfirmAction(null)
    },
    onError: (error: unknown) => {
      const apiError = error as ApiClientError | undefined
      if (apiError?.status === 409) {
        toast.error(apiError.message ?? '已有索引任务正在运行，请稍后再试')
        setConfirmAction(null)
        return
      }
      toast.error(apiError?.message ?? '触发索引失败，请重试')
    },
  })

  // 过滤数据
  const filteredData = useMemo(() => {
    if (!data?.items) return []
    return data.items
  }, [data?.items])

  const handleDelete = (repo: Repository) => {
    setConfirmAction({ type: 'delete', repo })
  }

  const handleTriggerIndex = (repo: Repository, forceFull: boolean = false) => {
    setConfirmAction({ type: 'triggerIndex', repo, forceFull })
  }

  const handleEdit = (repo: Repository) => {
    setEditingRepo(repo)
    setEditDialogOpen(true)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // 重置到第一页
  }

  // 搜索或筛选变化时重置到第一页
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleStatusChange = (statuses: RepositoryStatus[]) => {
    setSelectedStatuses(statuses)
    setCurrentPage(1)
  }

  const handleConfirm = () => {
    if (!confirmAction) return

    if (confirmAction.type === 'delete') {
      deleteMutation.mutate(confirmAction.repo.id)
    } else if (confirmAction.type === 'triggerIndex') {
      triggerIndexMutation.mutate({
        id: confirmAction.repo.id,
        forceFull: confirmAction.forceFull,
      })
    }
  }

  return (
    <div className='space-y-4'>
      {/* 页面标题 */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-bold'>
            <GitBranch className='h-6 w-6' />
            代码仓库管理
          </h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            管理代码仓库并触发索引任务
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          添加仓库
        </Button>
      </div>

      {/* 过滤栏 */}
      <div className='flex items-center gap-2'>
        <div className='relative flex-1'>
          <SearchIcon className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='搜索仓库名称或 URL...'
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='pl-9'
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>
              <SlidersHorizontal className='mr-2 h-4 w-4' />
              状态筛选
              {selectedStatuses.length > 0 && (
                <span className='bg-primary text-primary-foreground ml-2 rounded-full px-2 py-0.5 text-xs'>
                  {selectedStatuses.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48'>
            <DropdownMenuLabel>按状态筛选</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={selectedStatuses.includes(option.value)}
                onCheckedChange={(checked) => {
                  const newStatuses = checked
                    ? [...selectedStatuses, option.value]
                    : selectedStatuses.filter((s) => s !== option.value)
                  handleStatusChange(newStatuses)
                }}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant='outline' size='icon' onClick={() => refetch()}>
          <RefreshCw className='h-4 w-4' />
        </Button>
      </div>

      {/* 表格 */}
      {isError ? (
        <ErrorState
          title='无法加载仓库列表'
          description='请刷新页面或稍后再试，若问题持续请联系平台团队。'
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <RepositoriesTable
            data={filteredData}
            isLoading={isLoading}
            onDelete={handleDelete}
            onTriggerIndex={handleTriggerIndex}
            onEdit={handleEdit}
          />

          {/* 分页控件 */}
          {!isLoading && data && data.total > 0 && (
            <div className='mt-4 flex items-center justify-between'>
              <div className='text-muted-foreground text-sm'>
                共 {data.total} 条记录，第 {currentPage} / {data.pages} 页
              </div>
              <ServerPagination
                currentPage={currentPage}
                totalPages={data.pages}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </>
      )}

      {/* 添加仓库对话框 */}
      <AddRepositoryDialog
        open={isAddDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: ['repositories'] })
        }}
      />

      {/* 确认对话框 */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction?.type === 'delete'
            ? '确认删除仓库'
            : confirmAction?.type === 'triggerIndex'
              ? confirmAction.forceFull
                ? '确认重新索引'
                : '确认同步'
              : ''
        }
        desc={
          confirmAction?.type === 'delete'
            ? `确定要删除仓库"${confirmAction.repo.name}"吗？此操作不可撤销。`
            : confirmAction?.type === 'triggerIndex'
              ? confirmAction.forceFull
                ? `确定要重新索引仓库"${confirmAction.repo.name}"吗？这将执行全量索引。`
                : `确定要同步仓库"${confirmAction.repo.name}"吗？这将执行增量索引。`
              : ''
        }
        handleConfirm={handleConfirm}
        destructive={confirmAction?.type === 'delete'}
      />

      <EditRepositoryDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            setEditingRepo(null)
          }
        }}
        repository={editingRepo}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: ['repositories'] })
        }}
      />
    </div>
  )
}
