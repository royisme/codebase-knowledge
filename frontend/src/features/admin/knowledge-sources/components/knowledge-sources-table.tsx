import { formatDistanceToNow } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal } from 'lucide-react'

import type { Identifier, KnowledgeSource } from '@/types'
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
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]

function formatLastSync(lastSyncedAt?: string) {
  if (!lastSyncedAt) return '从未同步'
  try {
    return `${formatDistanceToNow(new Date(lastSyncedAt), {
      addSuffix: true,
    })}`
  } catch (_error) {
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
}: KnowledgeSourcesTableProps) {
  const allCurrentPageIds = data.map((source) => source.id)
  const allSelected = allCurrentPageIds.length > 0 && allCurrentPageIds.every(id => selectedIds.includes(id))
  const someSelected = allCurrentPageIds.some(id => selectedIds.includes(id))

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return

    if (checked) {
      const newSelection = Array.from(new Set([...selectedIds, ...allCurrentPageIds]))
      onSelectionChange(newSelection)
    } else {
      const newSelection = selectedIds.filter(id => !allCurrentPageIds.includes(id))
      onSelectionChange(newSelection)
    }
  }

  const handleSelectItem = (id: Identifier, checked: boolean) => {
    if (!onSelectionChange) return

    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
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
      <div className='space-y-4 rounded-md border border-border/60 p-4'>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className='h-12 w-full rounded-md' />
        ))}
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className='space-y-4 rounded-md border border-border/60'>
      {/* 批量操作工具栏 */}
      {selectedIds.length > 0 && onBulkEnable && onBulkDisable && onBulkSync && (
        <div className='flex items-center gap-2 bg-muted/50 p-3 rounded-md border border-border/60'>
          <span className='text-sm font-medium'>
            已选择 {selectedIds.length} 项
          </span>
          <div className='flex items-center gap-1 ml-auto'>
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
                  onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
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
              <TableCell colSpan={onSelectionChange ? 7 : 6} className='py-12 text-center text-muted-foreground'>
                暂无符合条件的知识源。
              </TableCell>
            </TableRow>
          ) : (
            data.map((source) => (
              <TableRow key={source.id}>
                {onSelectionChange && (
                  <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(source.id)}
                    onCheckedChange={(checked) => handleSelectItem(source.id, Boolean(checked))}
                    aria-label={`选择 ${source.name}`}
                  />
                  </TableCell>
                )}
                <TableCell>
                  <div className='flex flex-col gap-1'>
                    <span className='font-medium text-foreground'>{source.name}</span>
                    <span className='text-xs text-muted-foreground'>ID: {source.id}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <a
                    className='text-sm text-primary underline-offset-2 hover:underline'
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='h-8 w-8'>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuLabel>操作</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => onEdit(source)}>
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onSync(source)}>
                        触发同步
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => onToggle(source)}>
                        {source.status === 'disabled' ? '启用' : '禁用'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => onDelete(source)}
                        className='text-destructive focus:text-destructive'
                      >
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className='flex flex-col gap-3 border-t border-border/60 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='text-sm text-muted-foreground'>
          共 {total} 条记录 · 第 {page} / {totalPages} 页
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground'>每页显示</span>
            <select
              className='h-9 rounded-md border border-border bg-background px-2 text-sm'
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
