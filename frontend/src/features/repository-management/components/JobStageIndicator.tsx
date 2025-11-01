import { type JobStage } from '@/types/job'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STAGES: Array<{ key: JobStage; label: string }> = [
  { key: 'git_clone', label: 'Git 克隆' },
  { key: 'file_scan', label: '文件扫描' },
  { key: 'code_parse', label: '代码解析' },
  { key: 'embedding', label: '向量化' },
  { key: 'graph_build', label: '图谱构建' },
  { key: 'completed', label: '完成' },
]

interface JobStageIndicatorProps {
  currentStage: JobStage
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
}

export function JobStageIndicator({
  currentStage,
  status,
}: JobStageIndicatorProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage)

  return (
    <div className="space-y-4">
      {STAGES.map((stage, index) => {
        const isCompleted = index < currentIndex || status === 'completed'
        const isCurrent = index === currentIndex && status === 'running'
        const isFailed = status === 'failed' && index === currentIndex

        return (
          <div key={stage.key} className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2',
                {
                  'border-primary bg-primary text-primary-foreground':
                    isCompleted,
                  'border-primary bg-background': isCurrent,
                  'border-destructive bg-destructive/10': isFailed,
                  'border-muted bg-background': !isCompleted && !isCurrent && !isFailed,
                }
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : isCurrent ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p
                className={cn('text-sm font-medium', {
                  'text-foreground': isCompleted || isCurrent,
                  'text-muted-foreground': !isCompleted && !isCurrent,
                  'text-destructive': isFailed,
                })}
              >
                {stage.label}
              </p>
              {isCurrent && (
                <p className="text-xs text-muted-foreground">进行中...</p>
              )}
              {isFailed && (
                <p className="text-xs text-destructive">此阶段失败</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
