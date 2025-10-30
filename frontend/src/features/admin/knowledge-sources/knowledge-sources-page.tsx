import { useDeferredValue, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type {
  CreateKnowledgeSourcePayload,
  Identifier,
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
  bulkOperationOnKnowledgeSources,
  createKnowledgeSource,
  deleteKnowledgeSource,
  listKnowledgeSources,
  triggerKnowledgeSourceSync,
  updateKnowledgeSource,
  type KnowledgeSourceListResponse,
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
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  KnowledgeSourceFormDialog,
  type KnowledgeSourceFormValues,
} from './components/knowledge-source-form-dialog'
import { KnowledgeSourcesTable } from './components/knowledge-sources-table'

const statusOptions: Array<{ value: KnowledgeSourceStatus; label: string }> = [
  { value: 'active', label: '已启用' },
  { value: 'syncing', label: '同步中' },
  { value: 'disabled', label: '已禁用' },
  { value: 'error', label: '异常' },
]

type ConfirmAction =
  | { type: 'delete'; source: KnowledgeSource }
  | { type: 'toggle'; source: KnowledgeSource }
  | null

function toParserConfig(
  values: KnowledgeSourceFormValues
): CreateKnowledgeSourcePayload['parserConfig'] {
  const languages = values.languages
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  const pathAllowList = values.pathAllowList
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  const maxDepth =
    values.maxDepth && values.maxDepth.length > 0
      ? Number(values.maxDepth)
      : undefined

  return {
    languages: languages.length > 0 ? languages : ['python'],
    pathAllowList:
      pathAllowList && pathAllowList.length > 0 ? pathAllowList : undefined,
    maxDepth,
    enableIncrementalRefresh: values.enableIncrementalRefresh,
  }
}

const route = getRouteApi('/admin/sources')

export function KnowledgeSourcesPage() {
  const routeSearchParams = route.useSearch()
  const navigate = route.useNavigate()

  const [isDialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<KnowledgeSource | undefined>(undefined)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [selectedIds, setSelectedIds] = useState<Identifier[]>([])

  const [bulkConfirmAction, setBulkConfirmAction] = useState<{
    type: 'enable' | 'disable' | 'sync'
    ids: string[]
  } | null>(null)

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
      'knowledge-sources',
      { page, pageSize, search: deferredSearch, statuses: normalizedStatuses },
    ]
  }, [page, pageSize, deferredSearch, statusFilters])

  const listQuery = useQuery<KnowledgeSourceListResponse>({
    queryKey,
    queryFn: () =>
      listKnowledgeSources({
        page,
        pageSize,
        search: deferredSearch,
        statuses: statusFilters.length > 0 ? statusFilters : undefined,
      }),
    placeholderData: (previous) => previous,
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateKnowledgeSourcePayload) =>
      createKnowledgeSource(payload),
    onSuccess: () => {
      toast.success('知识源已创建')
      queryClient.invalidateQueries({ queryKey })
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
      id: Identifier
      payload: Partial<CreateKnowledgeSourcePayload> & {
        status?: KnowledgeSourceStatus
      }
    }) => updateKnowledgeSource(id, payload),
    onSuccess: () => {
      toast.success('知识源已更新')
      queryClient.invalidateQueries({ queryKey })
      setDialogOpen(false)
    },
    onError: () => {
      toast.error('更新知识源失败，请稍后重试')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: Identifier) => deleteKnowledgeSource(id),
    onSuccess: () => {
      toast.success('知识源已删除')
      queryClient.invalidateQueries({ queryKey })
      setConfirmAction(null)
    },
    onError: () => {
      toast.error('删除知识源失败')
    },
  })

  const syncMutation = useMutation({
    mutationFn: (id: Identifier) => triggerKnowledgeSourceSync(id),
    onSuccess: (response) => {
      toast.success(response.message ?? '已触发同步')
      queryClient.invalidateQueries({ queryKey })
    },
    onError: () => {
      toast.error('触发同步失败')
    },
  })

  const bulkEnableMutation = useMutation({
    mutationFn: (ids: string[]) =>
      bulkOperationOnKnowledgeSources({ ids, operation: 'enable' }),
    onSuccess: (response) => {
      toast.success(response.message)
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey })
    },
    onError: () => {
      toast.error('批量启用失败')
    },
  })

  const bulkDisableMutation = useMutation({
    mutationFn: (ids: string[]) =>
      bulkOperationOnKnowledgeSources({ ids, operation: 'disable' }),
    onSuccess: (response) => {
      toast.success(response.message)
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey })
    },
    onError: () => {
      toast.error('批量禁用失败')
    },
  })

  const bulkSyncMutation = useMutation({
    mutationFn: (ids: string[]) =>
      bulkOperationOnKnowledgeSources({ ids, operation: 'sync' }),
    onSuccess: (response) => {
      toast.success(response.message)
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey })
    },
    onError: () => {
      toast.error('批量同步失败')
    },
  })

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    syncMutation.isPending ||
    bulkEnableMutation.isPending ||
    bulkDisableMutation.isPending ||
    bulkSyncMutation.isPending

  const onCreate = () => {
    setMode('create')
    setEditing(undefined)
    setDialogOpen(true)
  }

  const onEdit = (source: KnowledgeSource) => {
    setMode('edit')
    setEditing(source)
    setDialogOpen(true)
  }

  const onToggle = (source: KnowledgeSource) => {
    setConfirmAction({ type: 'toggle', source })
  }

  const onDeleteRequest = (source: KnowledgeSource) => {
    setConfirmAction({ type: 'delete', source })
  }

  const handleSubmit = async (values: KnowledgeSourceFormValues) => {
    const parserConfig = toParserConfig(values)

    if (mode === 'create') {
      await createMutation.mutateAsync({
        name: values.name,
        repositoryUrl: values.repositoryUrl,
        defaultBranch: values.defaultBranch,
        credentialMode: values.credentialMode,
        parserConfig,
      })
      return
    }

    if (!editing) return
    await updateMutation.mutateAsync({
      id: editing.id,
      payload: {
        name: values.name,
        repositoryUrl: values.repositoryUrl,
        defaultBranch: values.defaultBranch,
        credentialMode: values.credentialMode,
        parserConfig,
      },
    })
  }

  const handleConfirm = async () => {
    if (!confirmAction) return
    const source = confirmAction.source

    if (confirmAction.type === 'delete') {
      await deleteMutation.mutateAsync(source.id)
      return
    }

    const nextStatus = source.status === 'disabled' ? 'active' : 'disabled'
    await updateMutation.mutateAsync({
      id: source.id,
      payload: { status: nextStatus },
    })
    toast.success(nextStatus === 'active' ? '已启用知识源' : '已禁用知识源')
    setConfirmAction(null)
  }

  const updateSearchParam = (updates: Partial<typeof routeSearchParams>) => {
    navigate({
      search: (prev: typeof routeSearchParams) => ({ ...prev, ...updates }),
    })
  }

  const toggleStatusFilter = (status: KnowledgeSourceStatus) => {
    const newFilters = statusFilters.includes(status)
      ? statusFilters.filter((item: KnowledgeSourceStatus) => item !== status)
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

  const handleBulkEnable = (ids: string[]) => {
    setBulkConfirmAction({ type: 'enable', ids })
  }

  const handleBulkDisable = (ids: string[]) => {
    setBulkConfirmAction({ type: 'disable', ids })
  }

  const handleBulkSync = (ids: string[]) => {
    setBulkConfirmAction({ type: 'sync', ids })
  }

  const handleBulkConfirm = async () => {
    if (!bulkConfirmAction) return

    const { type, ids } = bulkConfirmAction

    try {
      switch (type) {
        case 'enable':
          await bulkEnableMutation.mutateAsync(ids)
          break
        case 'disable':
          await bulkDisableMutation.mutateAsync(ids)
          break
        case 'sync':
          await bulkSyncMutation.mutateAsync(ids)
          break
      }
      setBulkConfirmAction(null)
    } catch {
      // Error handling is done in mutations
    }
  }

  return (
    <div className='space-y-6'>
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
            placeholder='搜索知识源名称或仓库地址'
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
            {statusOptions.map((option) => (
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
          onClick={() => listQuery.refetch()}
          variant='ghost'
          size='icon'
          className='ml-auto'
        >
          <RefreshCw className='h-4 w-4' />
        </Button>

        <Button onClick={onCreate} className='ml-auto'>
          <Plus className='mr-2 h-4 w-4' />
          新增知识源
        </Button>
      </div>

      <KnowledgeSourcesTable
        data={listQuery.data?.items ?? []}
        isLoading={listQuery.isLoading}
        page={page}
        pageSize={pageSize}
        total={listQuery.data?.total ?? 0}
        onPageChange={(next) => updateSearchParam({ page: Math.max(1, next) })}
        onPageSizeChange={(size) => {
          updateSearchParam({
            pageSize: size,
            page: 1,
          })
        }}
        onEdit={onEdit}
        onToggle={onToggle}
        onDelete={onDeleteRequest}
        onSync={(source) => {
          void syncMutation.mutateAsync(source.id)
        }}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onBulkEnable={handleBulkEnable}
        onBulkDisable={handleBulkDisable}
        onBulkSync={handleBulkSync}
        isMutating={isMutating}
        searchParams={{
          search: routeSearchParams.search,
          statuses: routeSearchParams.statuses,
        }}
      />

      <KnowledgeSourceFormDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        initialData={editing}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {confirmAction && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setConfirmAction(null)
          }}
          title={
            confirmAction.type === 'delete'
              ? '删除知识源'
              : confirmAction.source.status === 'disabled'
                ? '启用知识源'
                : '禁用知识源'
          }
          desc={
            confirmAction.type === 'delete'
              ? '删除后将无法恢复，确定要继续吗？'
              : confirmAction.source.status === 'disabled'
                ? '确认启用该知识源？开启后将允许触发同步。'
                : '确认禁用该知识源？禁用后将暂停同步任务。'
          }
          confirmText={confirmAction.type === 'delete' ? '删除' : '确认'}
          cancelBtnText='取消'
          destructive={confirmAction.type === 'delete'}
          handleConfirm={() => void handleConfirm()}
          isLoading={updateMutation.isPending || deleteMutation.isPending}
        />
      )}

      {bulkConfirmAction && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setBulkConfirmAction(null)
          }}
          title={
            bulkConfirmAction.type === 'enable'
              ? '批量启用知识源'
              : bulkConfirmAction.type === 'disable'
                ? '批量禁用知识源'
                : '批量触发同步'
          }
          desc={
            bulkConfirmAction.type === 'enable'
              ? `确认启用选中的 ${bulkConfirmAction.ids.length} 个知识源？`
              : bulkConfirmAction.type === 'disable'
                ? `确认禁用选中的 ${bulkConfirmAction.ids.length} 个知识源？`
                : `确认触发选中的 ${bulkConfirmAction.ids.length} 个知识源同步？`
          }
          confirmText='确认'
          cancelBtnText='取消'
          destructive={bulkConfirmAction.type === 'disable'}
          handleConfirm={() => void handleBulkConfirm()}
          isLoading={
            bulkEnableMutation.isPending ||
            bulkDisableMutation.isPending ||
            bulkSyncMutation.isPending
          }
        />
      )}
    </div>
  )
}
