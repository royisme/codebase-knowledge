import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type {
  CreateKnowledgeSourcePayload,
  KnowledgeSource,
  KnowledgeSourceStatus,
} from '@/types'
import {
  Plus,
  RefreshCw,
  Search as SearchIcon,
  SlidersHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createKnowledgeSource,
  deleteKnowledgeSource,
  listKnowledgeSources,
  triggerKnowledgeSourceSync,
  updateKnowledgeSource,
} from '@/lib/knowledge-source-service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  KnowledgeSourceFormDialog,
  type KnowledgeSourceFormValues,
} from './components/knowledge-source-form-dialog'
import { KnowledgeSourcesTable } from './components/knowledge-sources-table'

const statusOptions: Array<{ value: KnowledgeSourceStatus; label: string }> = [
  { value: 'active', label: '已启用' },
  { value: 'disabled', label: '已禁用' },
]

const route = getRouteApi('/admin/sources')

const mapFormToPayload = (
  values: KnowledgeSourceFormValues
): CreateKnowledgeSourcePayload => {
  const languages = values.languages
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  const pathAllowList = values.pathAllowList
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return {
    name: values.name,
    repositoryUrl: values.repositoryUrl,
    defaultBranch: values.defaultBranch,
    credentialMode: values.credentialMode,
    parserConfig: {
      languages: languages.length > 0 ? languages : ['python', 'typescript'],
      pathAllowList:
        pathAllowList && pathAllowList.length > 0 ? pathAllowList : undefined,
      maxDepth: values.maxDepth ? Number(values.maxDepth) : undefined,
      enableIncrementalRefresh: values.enableIncrementalRefresh,
    },
  }
}

export function KnowledgeSourcesPage() {
  const routeSearch = route.useSearch() as {
    page?: number
    pageSize?: number
    search?: string
    statuses?: KnowledgeSourceStatus[]
  }
  const navigate = route.useNavigate()
  const queryClient = useQueryClient()

  const [isDialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<KnowledgeSource | undefined>(undefined)
  const [confirmAction, setConfirmAction] = useState<
    | { type: 'delete'; source: KnowledgeSource }
    | { type: 'toggle'; source: KnowledgeSource }
    | null
  >(null)

  const page = routeSearch.page ?? 1
  const pageSize = routeSearch.pageSize ?? 10
  const searchValue = routeSearch.search ?? ''
  const statusFilters = useMemo(
    () => routeSearch.statuses ?? [],
    [routeSearch.statuses]
  )

  const listQuery = useQuery<Awaited<ReturnType<typeof listKnowledgeSources>>>({
    queryKey: [
      'admin',
      'knowledge-sources',
      {
        page,
        pageSize,
        search: searchValue,
        statuses: statusFilters,
      },
    ],
    queryFn: () =>
      listKnowledgeSources({
        page,
        pageSize,
        search: searchValue,
        statuses: statusFilters,
      }),
    placeholderData: (previous) => previous,
  })

  useEffect(() => {
    if (listQuery.isError) {
      toast.error('知识源列表加载失败，请稍后重试')
    }
  }, [listQuery.isError])

  const createMutation = useMutation({
    mutationFn: (payload: CreateKnowledgeSourcePayload) =>
      createKnowledgeSource(payload),
    onSuccess: () => {
      toast.success('知识源已创建')
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'knowledge-sources'],
      })
      setDialogOpen(false)
    },
    onError: () => {
      toast.error('创建知识源失败，请检查输入')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<CreateKnowledgeSourcePayload> & {
        status?: KnowledgeSourceStatus
      }
    }) => updateKnowledgeSource(id, payload),
    onSuccess: () => {
      toast.success('知识源已更新')
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'knowledge-sources'],
      })
      setDialogOpen(false)
      setConfirmAction(null)
    },
    onError: () => {
      toast.error('更新知识源失败，请稍后重试')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteKnowledgeSource(id),
    onSuccess: () => {
      toast.success('知识源已删除')
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'knowledge-sources'],
      })
      setConfirmAction(null)
    },
    onError: () => {
      toast.error('删除知识源失败')
    },
  })

  const syncMutation = useMutation({
    mutationFn: (id: string) => triggerKnowledgeSourceSync(id),
    onSuccess: (response) => {
      toast.success(response.message ?? '已触发同步')
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'knowledge-sources'],
      })
    },
    onError: () => {
      toast.error('触发同步失败')
    },
  })

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    syncMutation.isPending

  const updateSearchParam = (updates: Partial<typeof routeSearch>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...updates,
      }),
    })
  }

  const handleSubmit = async (values: KnowledgeSourceFormValues) => {
    const payload = mapFormToPayload(values)
    if (mode === 'create') {
      await createMutation.mutateAsync(payload)
      return
    }

    if (!editing) return
    await updateMutation.mutateAsync({
      id: editing.id,
      payload,
    })
  }

  const handleToggleStatus = async (source: KnowledgeSource) => {
    const nextStatus: KnowledgeSourceStatus =
      source.status === 'active' ? 'disabled' : 'active'
    await updateMutation.mutateAsync({
      id: source.id,
      payload: { status: nextStatus },
    })
  }

  const handleDelete = async (source: KnowledgeSource) => {
    await deleteMutation.mutateAsync(source.id)
  }

  const handleSync = async (source: KnowledgeSource) => {
    await syncMutation.mutateAsync(source.id)
  }

  const handleEdit = (source: KnowledgeSource) => {
    setMode('edit')
    setEditing(source)
    setDialogOpen(true)
  }

  const onCreate = () => {
    setMode('create')
    setEditing(undefined)
    setDialogOpen(true)
  }

  const onDeleteRequest = (source: KnowledgeSource) => {
    setConfirmAction({ type: 'delete', source })
  }

  const onToggleRequest = (source: KnowledgeSource) => {
    setConfirmAction({ type: 'toggle', source })
  }

  const handleConfirm = async () => {
    if (!confirmAction) return
    if (confirmAction.type === 'delete') {
      await handleDelete(confirmAction.source)
      return
    }
    await handleToggleStatus(confirmAction.source)
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative w-full max-w-md'>
          <SearchIcon className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            value={searchValue}
            onChange={(event) =>
              updateSearchParam({ search: event.target.value, page: 1 })
            }
            placeholder='搜索知识源名称或仓库地址'
            className='pl-9'
            disabled={isMutating}
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
            {statusOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={statusFilters.includes(option.value)}
                onCheckedChange={() => {
                  const exists = statusFilters.includes(option.value)
                  const next = exists
                    ? statusFilters.filter((item) => item !== option.value)
                    : [...statusFilters, option.value]
                  updateSearchParam({ statuses: next, page: 1 })
                }}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
            {statusFilters.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => updateSearchParam({ statuses: [], page: 1 })}
                >
                  清除筛选
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button className='ml-auto' onClick={onCreate} disabled={isMutating}>
          <Plus className='mr-2 h-4 w-4' />
          新增知识源
        </Button>
        <Button
          variant='outline'
          onClick={() =>
            void queryClient.invalidateQueries({
              queryKey: ['admin', 'knowledge-sources'],
            })
          }
          disabled={listQuery.isLoading}
        >
          <RefreshCw className='mr-2 h-4 w-4' />
          刷新
        </Button>
      </div>

      {listQuery.isError ? (
        <ErrorState
          title='无法加载知识源列表'
          description='请检查网络或稍后再试，若问题持续请联系平台团队。'
          onRetry={() => listQuery.refetch()}
        />
      ) : (
        <KnowledgeSourcesTable
          data={listQuery.data?.items ?? []}
          isLoading={listQuery.isLoading}
          page={page}
          pageSize={pageSize}
          total={listQuery.data?.total ?? 0}
          onPageChange={(nextPage) => updateSearchParam({ page: nextPage })}
          onPageSizeChange={(nextSize) =>
            updateSearchParam({ pageSize: nextSize, page: 1 })
          }
          onEdit={handleEdit}
          onToggle={onToggleRequest}
          onDelete={onDeleteRequest}
          onSync={handleSync}
          isMutating={isMutating}
        />
      )}

      <KnowledgeSourceFormDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editing}
        mode={mode}
        onSubmit={handleSubmit}
        isSubmitting={isMutating}
      />

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null)
        }}
        title={
          confirmAction?.type === 'delete' ? '删除知识源' : '切换知识源状态'
        }
        desc={
          confirmAction?.type === 'delete'
            ? '确定要删除该知识源吗？此操作无法撤销。'
            : '确定要切换知识源启用状态吗？'
        }
        confirmText={confirmAction?.type === 'delete' ? '删除' : '确认'}
        destructive={confirmAction?.type === 'delete'}
        handleConfirm={handleConfirm}
        isLoading={isMutating}
      />
    </div>
  )
}
