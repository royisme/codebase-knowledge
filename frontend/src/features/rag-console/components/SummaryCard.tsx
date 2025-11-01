import { Clock, Database, Zap, GitBranch } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { QueryMetadata } from '../types/mvp'

interface SummaryCardProps {
  metadata: QueryMetadata
}

const getModeLabel = (mode: string) => {
  switch (mode) {
    case 'graph':
      return 'Graph 图谱'
    case 'vector':
      return 'Vector 向量'
    case 'hybrid':
      return 'Hybrid 混合'
    default:
      return mode
  }
}

const getModeColor = (mode: string) => {
  switch (mode) {
    case 'graph':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
    case 'vector':
      return 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
    case 'hybrid':
      return 'bg-green-500/10 text-green-700 dark:text-green-400'
    default:
      return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
  }
}

export function SummaryCard({ metadata }: SummaryCardProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* 检索模式 */}
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">检索模式：</span>
          <Badge
            variant="secondary"
            className={getModeColor(metadata.retrievalMode)}
          >
            {getModeLabel(metadata.retrievalMode)}
          </Badge>
        </div>

        {/* 执行耗时 */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">耗时：</span>
          <span className="text-sm font-medium">
            {metadata.executionTimeMs} ms
          </span>
        </div>

        {/* 缓存状态 */}
        <div className="flex items-center gap-2">
          {metadata.fromCache ? (
            <>
              <Database className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">从缓存</Badge>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">实时查询</Badge>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
