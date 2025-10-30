import type { KnowledgeSourceStatus } from '@/types'
import { Badge } from '@/components/ui/badge'

const STATUS_LABELS: Record<KnowledgeSourceStatus, string> = {
  active: '已启用',
  disabled: '已禁用',
  syncing: '同步中',
  error: '异常',
}

const STATUS_STYLES: Record<KnowledgeSourceStatus, string> = {
  active:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  disabled: 'bg-muted text-muted-foreground',
  syncing: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300',
  error: 'bg-destructive/10 text-destructive',
}

interface KnowledgeSourceStatusBadgeProps {
  status: KnowledgeSourceStatus
}

export function KnowledgeSourceStatusBadge({
  status,
}: KnowledgeSourceStatusBadgeProps) {
  return (
    <Badge variant='outline' className={STATUS_STYLES[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
