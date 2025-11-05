import { formatDistanceToNow } from 'date-fns'
import type { Repository } from '@/types/repository'
import { zhCN } from 'date-fns/locale'
import { GitBranch } from 'lucide-react'
import { ActionMenu } from '@/components/ui/action-menu'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RepositoryStatusBadge } from './RepositoryStatusBadge'

interface RepositoriesTableProps {
  data: Repository[]
  isLoading: boolean
  onDelete: (repo: Repository) => void
  onTriggerIndex: (repo: Repository, forceFull?: boolean) => void
  onEdit: (repo: Repository) => void
}

function formatLastSync(lastSyncedAt?: string) {
  if (!lastSyncedAt) return '从未索引'
  try {
    return formatDistanceToNow(new Date(lastSyncedAt), {
      addSuffix: true,
      locale: zhCN,
    })
  } catch {
    return '时间格式错误'
  }
}

function getTopLanguages(languages?: Record<string, number>): string[] {
  if (!languages) return []
  return Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([lang]) => lang)
}

export function RepositoriesTable({
  data,
  isLoading,
  onDelete,
  onTriggerIndex,
  onEdit,
}: RepositoriesTableProps) {
  if (isLoading) {
    return (
      <div className='space-y-2'>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className='h-16 w-full' />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className='flex h-64 items-center justify-center rounded-lg border border-dashed'>
        <div className='text-center'>
          <GitBranch className='text-muted-foreground mx-auto h-12 w-12' />
          <h3 className='mt-4 text-lg font-semibold'>暂无仓库</h3>
          <p className='text-muted-foreground mt-2 text-sm'>
            点击"添加仓库"按钮开始创建
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>仓库名称</TableHead>
            <TableHead>Git URL</TableHead>
            <TableHead>分支</TableHead>
            <TableHead>语言</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>统计</TableHead>
            <TableHead>最后索引</TableHead>
            <TableHead className='w-[100px]'>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((repo) => {
            const languages = getTopLanguages(repo.source_metadata?.languages)
            const repoUrl = repo.connection_config?.repo_url
            const branch = repo.connection_config?.branch

            return (
              <TableRow key={repo.id}>
                <TableCell className='font-medium'>{repo.name}</TableCell>
                <TableCell className='text-muted-foreground max-w-[300px] truncate text-sm'>
                  {repoUrl ?? '-'}
                </TableCell>
                <TableCell>
                  {branch ? (
                    <Badge variant='outline' className='font-mono text-xs'>
                      {branch}
                    </Badge>
                  ) : (
                    <span className='text-muted-foreground text-xs'>-</span>
                  )}
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
                  <RepositoryStatusBadge
                    status={
                      repo.source_metadata?.index_version
                        ? 'indexed'
                        : 'pending_index'
                    }
                  />
                </TableCell>
                <TableCell className='text-muted-foreground text-sm'>
                  {repo.source_metadata?.total_files ? (
                    <div className='flex flex-col gap-0.5'>
                      <span>文件: {repo.source_metadata.total_files}</span>
                      <span>
                        函数: {repo.source_metadata.total_functions || 0}
                      </span>
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className='text-muted-foreground text-sm'>
                  {formatLastSync(repo.last_synced_at)}
                </TableCell>
                <TableCell>
                  <ActionMenu
                    groups={[
                      {
                        actions: [
                          {
                            label: '编辑',
                            onSelect: () => onEdit(repo),
                          },
                          {
                            label: '同步',
                            onSelect: () => onTriggerIndex(repo, false),
                            disabled: !repo.source_metadata?.index_version,
                          },
                          {
                            label: '重新索引',
                            onSelect: () => onTriggerIndex(repo, true),
                          },
                        ],
                      },
                      {
                        actions: [
                          {
                            label: '查看任务',
                            link: {
                              to: '/admin/repositories/$repoId/jobs',
                              params: { repoId: repo.id },
                            },
                          },
                        ],
                      },
                      {
                        actions: [
                          {
                            label: '删除',
                            onSelect: () => onDelete(repo),
                            destructive: true,
                          },
                        ],
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
