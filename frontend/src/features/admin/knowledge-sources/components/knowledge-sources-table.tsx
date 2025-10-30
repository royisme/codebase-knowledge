import { formatDistanceToNow } from 'date-fns'
import type {
  Identifier,
  KnowledgeSource,
  KnowledgeSourceStatus,
} from '@/types'
import { ActionMenu } from '@/components/ui/action-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { KnowledgeSourceStatusBadge } from './knowledge-source-status-badge'

interface KnowledgeSourcesTableProps {
  data: KnowledgeSource[]
  isLoading: boolean
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onEdit: (source: KnowledgeSource) => void
  onToggle: (source: KnowledgeSource) => void
  onDelete: (source: KnowledgeSource) => void
  onSync: (source: KnowledgeSource) => void
  selectedIds?: Identifier[]
  onSelectionChange?: (selectedIds: Identifier[]) => void
  onBulkEnable?: (ids: Identifier[]) => void
  onBulkDisable?: (ids: Identifier[]) => void
  onBulkSync?: (ids: Identifier[]) => void
  isMutating?: boolean
  searchParams?: {
    search?: string
    statuses?: KnowledgeSourceStatus[]
  }
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]

function formatLastSync(lastSyncedAt?: string) {
  if (!lastSyncedAt) return '从未同步'
  try {
    return `${formatDistanceToNow(new Date(lastSyncedAt), {
      addSuffix: true,
    })}`
  } catch {
    return '时间格式错误'
  }
}

export function KnowledgeSourcesTable({
  data,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onToggle,
  onDelete,
  onSync,
  selectedIds = [],
  onSelectionChange,
  onBulkEnable,
  onBulkDisable,
  onBulkSync,
  isMutating,
  searchParams,
}: KnowledgeSourcesTableProps) {
  const allCurrentPageIds = data.map((source) => source.id)
  const allSelected =
    allCurrentPageIds.length > 0 &&
    allCurrentPageIds.every((id) => selectedIds.includes(id))
  const someSelected = allCurrentPageIds.some((id) => selectedIds.includes(id))

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return

    if (checked) {
      const newSelection = Array.from(
        new Set([...selectedIds, ...allCurrentPageIds])
      )
      onSelectionChange(newSelection)
    } else {
      const newSelection = selectedIds.filter(
        (id) => !allCurrentPageIds.includes(id)
      )
      onSelectionChange(newSelection)
    }
  }

  const handleSelectItem = (id: Identifier, checked: boolean) => {
    if (!onSelectionChange) return

    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id))
    }
  }

  const handleBulkEnable = () => {
    if (onBulkEnable && selectedIds.length > 0) {
      onBulkEnable(selectedIds)
    }
  }

  const handleBulkDisable = () => {
    if (onBulkDisable && selectedIds.length > 0) {
      onBulkDisable(selectedIds)
    }
  }

  const handleBulkSync = () => {
    if (onBulkSync && selectedIds.length > 0) {
      onBulkSync(selectedIds)
    }
  }

  if (isLoading) {
    return (
      <div className='border-border/60 space-y-4 rounded-md border'>
        <div className='p-4'>
          <div className='space-y-3'>
            {/* Header skeleton */}
            <div className='flex items-center justify-between'>
              <Skeleton className='h-6 w-32' />
              <Skeleton className='h-9 w-24' />
            </div>

            {/* Table skeleton */}
            <div className='space-y-2'>
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className='border-border/40 flex items-center space-x-4 border-b p-3'
                >
                  <Skeleton className='h-4 w-4' />
                  <Skeleton className='h-4 w-48' />
                  <Skeleton className='h-4 w-64' />
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-4' />
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-8 w-8' />
                </div>
              ))}
            </div>

            {/* Pagination skeleton */}
            <div className='flex items-center justify-between pt-4'>
              <Skeleton className='h-4 w-32' />
              <div className='flex space-x-2'>
                <Skeleton className='h-8 w-16' />
                <Skeleton className='h-8 w-16' />
                <Skeleton className='h-9 w-20' />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className='border-border/60 space-y-4 rounded-md border'>
      {/* 批量操作工具栏 */}
      {selectedIds.length > 0 &&
        onBulkEnable &&
        onBulkDisable &&
        onBulkSync && (
          <div className='bg-muted/50 border-border/60 flex items-center gap-2 rounded-md border p-3'>
            <span className='text-sm font-medium'>
              已选择 {selectedIds.length} 项
            </span>
            <div className='ml-auto flex items-center gap-1'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleBulkEnable}
                disabled={isMutating}
              >
                批量启用
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={handleBulkDisable}
                disabled={isMutating}
              >
                批量禁用
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={handleBulkSync}
                disabled={isMutating}
              >
                批量同步
              </Button>
            </div>
          </div>
        )}

      <Table>
        <TableHeader>
          <TableRow>
            {onSelectionChange && (
              <TableHead className='w-12'>
                <Checkbox
                  checked={allSelected}
                  data-state={someSelected ? 'indeterminate' : undefined}
                  onCheckedChange={(checked) =>
                    handleSelectAll(Boolean(checked))
                  }
                  aria-label='全选'
                />
              </TableHead>
            )}
            <TableHead>名称</TableHead>
            <TableHead>仓库地址</TableHead>
            <TableHead>默认分支</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>最近同步</TableHead>
            <TableHead className='text-right'>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={onSelectionChange ? 7 : 6} className='py-16'>
                <div className='flex flex-col items-center justify-center space-y-3 text-center'>
                  <div className='bg-muted flex h-12 w-12 items-center justify-center rounded-full'>
                    <svg
                      className='text-muted-foreground h-6 w-6'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                      />
                    </svg>
                  </div>
                  <div className='space-y-1'>
                    <h3 className='text-foreground text-lg font-medium'>
                      暂无知识源
                    </h3>
                    <p className='text-muted-foreground max-w-sm text-sm'>
                      {searchParams?.search ||
                      (searchParams?.statuses &&
                        searchParams.statuses.length > 0)
                        ? '没有找到符合条件的知识源，请尝试调整搜索条件或筛选器。'
                        : '还没有添加任何知识源，点击"新增知识源"开始添加。'}
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((source) => (
              <TableRow key={source.id}>
                {onSelectionChange && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(source.id)}
                      onCheckedChange={(checked) =>
                        handleSelectItem(source.id, Boolean(checked))
                      }
                      aria-label={`选择 ${source.name}`}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className='flex flex-col gap-1'>
                    <span className='text-foreground font-medium'>
                      {source.name}
                    </span>
                    <span className='text-muted-foreground text-xs'>
                      ID: {source.id}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <a
                    className='text-primary text-sm underline-offset-2 hover:underline'
                    href={source.repositoryUrl}
                    target='_blank'
                    rel='noreferrer'
                  >
                    {source.repositoryUrl}
                  </a>
                </TableCell>
                <TableCell>{source.defaultBranch}</TableCell>
                <TableCell>
                  <KnowledgeSourceStatusBadge status={source.status} />
                </TableCell>
                <TableCell>
                  <div className='flex flex-col gap-1 text-sm'>
                    <span>{formatLastSync(source.lastSyncedAt)}</span>
                    {source.lastTaskId && (
                      <Badge variant='secondary' className='w-fit'>
                        任务 {source.lastTaskId}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className='text-right'>
                  <ActionMenu
                    groups={[
                      {
                        label: '操作',
                        actions: [
                          {
                            label: '编辑',
                            onSelect: () => onEdit(source),
                          },
                          {
                            label: '触发同步',
                            onSelect: () => onSync(source),
                            disabled: source.status === 'disabled',
                          },
                        ],
                      },
                      {
                        actions: [
                          {
                            label:
                              source.status === 'disabled' ? '启用' : '禁用',
                            onSelect: () => onToggle(source),
                          },
                          {
                            label: '删除',
                            onSelect: () => onDelete(source),
                            destructive: true,
                          },
                        ],
                      },
                    ]}
                    triggerLabel={`操作 ${source.name}`}
                    disabled={isMutating}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className='border-border/60 bg-muted/10 flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='text-muted-foreground text-sm'>
          共 {total} 条记录 · 第 {page} / {totalPages} 页
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>每页显示</span>
            <select
              className='border-border bg-background h-9 rounded-md border px-2 text-sm'
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className='flex items-center gap-1'>
            <Button
              variant='outline'
              size='sm'
              disabled={page <= 1 || isMutating}
              onClick={() => onPageChange(page - 1)}
            >
              上一页
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={page >= totalPages || isMutating}
              onClick={() => onPageChange(page + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
