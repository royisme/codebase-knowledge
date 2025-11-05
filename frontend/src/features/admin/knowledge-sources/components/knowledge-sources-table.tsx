import { formatDistanceToNow } from 'date-fns'
import type { KnowledgeSource } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
  isMutating?: boolean
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const formatLastSynced = (lastSyncedAt?: string) => {
  if (!lastSyncedAt) return '从未同步'
  try {
    return formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })
  } catch {
    return '未知'
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
  isMutating,
}: KnowledgeSourcesTableProps) {
  if (isLoading) {
    return (
      <div className='space-y-3'>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className='h-20 w-full' />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className='border-border/60 text-muted-foreground rounded-md border p-8 text-center'>
        暂无符合条件的知识源
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className='space-y-4'>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>仓库地址</TableHead>
              <TableHead>默认分支</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>最后同步</TableHead>
              <TableHead className='text-right'>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((source) => (
              <TableRow key={source.id}>
                <TableCell className='font-medium'>{source.name}</TableCell>
                <TableCell className='max-w-xs truncate font-mono text-xs'>
                  {source.repositoryUrl}
                </TableCell>
                <TableCell>{source.defaultBranch}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      source.status === 'active' ? 'default' : 'secondary'
                    }
                  >
                    {source.status === 'active' ? '已启用' : '已禁用'}
                  </Badge>
                </TableCell>
                <TableCell>{formatLastSynced(source.lastSyncedAt)}</TableCell>
                <TableCell>
                  <div className='flex justify-end gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => onSync(source)}
                      disabled={isMutating}
                    >
                      触发同步
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => onToggle(source)}
                      disabled={isMutating}
                    >
                      {source.status === 'active' ? '禁用' : '启用'}
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => onEdit(source)}
                      disabled={isMutating}
                    >
                      编辑
                    </Button>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => onDelete(source)}
                      disabled={isMutating}
                    >
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='text-muted-foreground text-sm'>
          共 {total} 项 · 第 {page} / {totalPages} 页
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground text-sm'>每页</span>
          <select
            className='border-border rounded-md border bg-transparent px-2 py-1 text-sm'
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <div className='flex gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1 || isMutating}
            >
              上一页
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || isMutating}
            >
              下一页
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
