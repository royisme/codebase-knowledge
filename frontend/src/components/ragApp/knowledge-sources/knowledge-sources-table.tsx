import { formatDistanceToNow } from 'date-fns'
import type { KnowledgeSource } from '@/types'
import { RefreshCw, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  onSync: (
    source: KnowledgeSource,
    mode?: 'incremental' | 'full' | 'force_rebuild'
  ) => void
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

const getTopLanguages = (
  languages?: Record<string, number>,
  maxCount: number = 3
): string[] => {
  if (!languages) return []
  return Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxCount)
    .map(([lang]) => lang)
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
              <TableHead>语言</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>统计</TableHead>
              <TableHead>最后同步</TableHead>
              <TableHead className='text-right'>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((source) => {
              const languages = getTopLanguages(source.metadata?.languages)
              const hasIndexed = !!source.metadata?.index_version

              return (
                <TableRow key={source.id}>
                  <TableCell className='font-medium'>{source.name}</TableCell>
                  <TableCell className='max-w-xs truncate font-mono text-xs'>
                    {source.repositoryUrl}
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline' className='font-mono text-xs'>
                      {source.defaultBranch}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {languages.length > 0 ? (
                      <div className='flex gap-1'>
                        {languages.map((lang) => (
                          <Badge
                            key={lang}
                            variant='secondary'
                            className='text-xs'
                          >
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className='text-muted-foreground text-xs'>-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        source.status === 'active' ? 'default' : 'secondary'
                      }
                    >
                      {hasIndexed
                        ? source.status === 'active'
                          ? '已索引'
                          : '已禁用'
                        : '待索引'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground text-sm'>
                    {source.metadata?.total_files ? (
                      <div className='flex flex-col gap-0.5'>
                        <span>文件: {source.metadata.total_files}</span>
                        <span>
                          函数: {source.metadata.total_functions || 0}
                        </span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{formatLastSynced(source.lastSyncedAt)}</TableCell>
                  <TableCell>
                    <div className='flex justify-end gap-2'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size='sm'
                            variant='outline'
                            disabled={isMutating}
                          >
                            <RefreshCw className='mr-2 h-4 w-4' />
                            {hasIndexed ? '同步' : '索引'}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => onSync(source, 'incremental')}
                          >
                            <RefreshCw className='mr-2 h-4 w-4' />
                            增量同步
                          </DropdownMenuItem>
                          {hasIndexed && (
                            <>
                              <DropdownMenuItem
                                onClick={() => onSync(source, 'full')}
                              >
                                <RefreshCw className='mr-2 h-4 w-4' />
                                全量同步
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onSync(source, 'force_rebuild')}
                              >
                                <RotateCcw className='mr-2 h-4 w-4' />
                                强制重建
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
              )
            })}
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
