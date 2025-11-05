/**
 * 证据卡片组件 - 显示可回溯的代码证据
 * 
 * 功能：
 * - 显示代码片段
 * - 显示来源（仓库/文件/行号）
 * - 一键跳转到 GitHub 源码
 * - 显示置信度分数
 */

import { ExternalLink, FileCode, GitBranch } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { RagEvidence } from '@/types/rag'
import { cn } from '@/lib/utils'

interface EvidenceCardProps {
  evidence: RagEvidence
  className?: string
}

export function EvidenceCard({ evidence, className }: EvidenceCardProps) {
  const {
    index,
    snippet,
    repo,
    branch = 'main',
    file_path,
    start_line,
    end_line,
    score,
    link,
  } = evidence

  // 格式化置信度分数
  const confidencePercent = score ? Math.round(score * 100) : 0
  const confidenceColor = confidencePercent >= 80 
    ? 'text-emerald-600 dark:text-emerald-400' 
    : confidencePercent >= 60 
      ? 'text-blue-600 dark:text-blue-400'
      : 'text-muted-foreground'

  return (
    <Card className={cn('group hover:shadow-md transition-shadow', className)}>
      <CardContent className='p-4'>
        <div className='flex items-start gap-3'>
          {/* 编号标记 */}
          <div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-600 dark:text-blue-400'>
            {index}
          </div>

          <div className='flex-1 space-y-2'>
            {/* 文件路径和置信度 */}
            <div className='flex items-start justify-between gap-2'>
              <div className='flex-1'>
                {file_path && (
                  <div className='flex items-center gap-2 text-sm'>
                    <FileCode className='h-4 w-4 text-muted-foreground' />
                    <span className='font-mono text-xs text-foreground'>
                      {file_path}
                    </span>
                    {start_line && (
                      <span className='text-xs text-muted-foreground'>
                        L{start_line}
                        {end_line && end_line !== start_line && `-${end_line}`}
                      </span>
                    )}
                  </div>
                )}
                {repo && (
                  <div className='mt-1 flex items-center gap-2 text-xs text-muted-foreground'>
                    <GitBranch className='h-3 w-3' />
                    <span>{repo}</span>
                    <span className='text-muted-foreground/60'>@{branch}</span>
                  </div>
                )}
              </div>

              {/* 置信度 */}
              {score !== undefined && (
                <Badge variant='outline' className={cn('shrink-0', confidenceColor)}>
                  {confidencePercent}%
                </Badge>
              )}
            </div>

            {/* 代码片段 */}
            {snippet && (
              <pre className='overflow-x-auto rounded-md bg-muted/50 p-3 text-xs'>
                <code className='font-mono'>{snippet}</code>
              </pre>
            )}

            {/* 跳转按钮 */}
            {link && (
              <Button
                asChild
                variant='ghost'
                size='sm'
                className='h-8 gap-2 text-xs opacity-0 transition-opacity group-hover:opacity-100'
              >
                <a href={link} target='_blank' rel='noopener noreferrer'>
                  <ExternalLink className='h-3 w-3' />
                  在 GitHub 中查看
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface EvidenceListProps {
  evidence: RagEvidence[]
  className?: string
}

export function EvidenceList({ evidence, className }: EvidenceListProps) {
  if (!evidence || evidence.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)}>
      <h4 className='flex items-center gap-2 text-sm font-semibold text-foreground'>
        <FileCode className='h-4 w-4 text-blue-600 dark:text-blue-400' />
        证据来源 ({evidence.length})
      </h4>
      <div className='space-y-2'>
        {evidence.map((ev) => (
          <EvidenceCard key={ev.id} evidence={ev} />
        ))}
      </div>
    </div>
  )
}
