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
import { PageHeader } from '@/components/layout/page-header'
import { AddRepositoryDialog } from '@/components/ragApp/repository/AddRepositoryDialog'
import { EditRepositoryDialog } from '@/components/ragApp/repository/EditRepositoryDialog'
import { RepositoriesTable } from '@/components/ragApp/repository/RepositoriesTable'

const statusOptions: Array<{ value: RepositoryStatus; label: string }> = [
  { value: 'indexed', label: '已索引' },
  { value: 'indexing', label: '索引中' },
  { value: 'pending_index', label: '待索引' },
  { value: 'failed', label: '失败' },
  { value: 'pending', label: '待验证' },
]

type ConfirmAction =
  | { type: 'delete'; repo: Repository }
  | {
      type: 'triggerIndex'
      repo: Repository
      mode: 'incremental' | 'full' | 'force_rebuild'
    }
  | null

// 仓库列表内容组件（不含 PageHeader，可用于 Tab 中）
export function RepositoryListContent() {
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
    mutationFn: ({
      id,
      mode,
    }: {
      id: string
      mode: 'incremental' | 'full' | 'force_rebuild'
    }) => triggerIndex(id, { sync_mode: mode }),
    onSuccess: (data) => {
      const jobInfo = data.job_id ? `（ID: ${data.job_id.slice(0, 8)}）` : ''
      toast.success(`${data.message ?? '索引任务已创建'}${jobInfo}`)
      void queryClient.invalidateQueries({ queryKey: ['repositories'] })
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'knowledge-sources'],
      })
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

  const handleTriggerIndex = (
    repo: Repository,
    mode: 'incremental' | 'full' | 'force_rebuild' = 'incremental'
  ) => {
    setConfirmAction({ type: 'triggerIndex', repo, mode })
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
        mode: confirmAction.mode,
      })
    }
  }

  return (
    <div className='space-y-6'>
      {/* 操作栏 */}
      <div className='flex items-center justify-between'>
        <div className='flex flex-1 items-center gap-2'>
          <div className='relative max-w-md flex-1'>
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

        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          添加仓库
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
              ? confirmAction.mode === 'incremental'
                ? '增量同步'
                : confirmAction.mode === 'full'
                  ? '全量同步'
                  : '强制重建'
              : ''
        }
        desc={
          confirmAction?.type === 'delete'
            ? `确定要删除仓库"${confirmAction.repo.name}"吗？此操作不可撤销。`
            : confirmAction?.type === 'triggerIndex'
              ? confirmAction.mode === 'incremental'
                ? `确定要增量同步仓库"${confirmAction.repo.name}"吗？只处理变更的文件。`
                : confirmAction.mode === 'full'
                  ? `确定要全量同步仓库"${confirmAction.repo.name}"吗？重新索引所有文件，但不清空图谱。`
                  : `确定要强制重建仓库"${confirmAction.repo.name}"吗？这将清空现有图谱数据并完全重建。`
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

// 完整页面组件（包含 PageHeader）
export function RepositoryListPage() {
  return (
    <div className='space-y-6'>
      <PageHeader
        title='代码仓库管理'
        description='管理代码仓库并触发索引任务'
        icon={<GitBranch className='h-6 w-6' />}
      />
      <RepositoryListContent />
    </div>
  )
}
