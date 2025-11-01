import { Badge } from '@/components/ui/badge'
import type { RepositoryStatus } from '@/types/repository'
import { Loader2 } from 'lucide-react'

interface RepositoryStatusBadgeProps {
  status: RepositoryStatus
}

const STATUS_CONFIG: Record<
  RepositoryStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    className?: string
    showSpinner?: boolean
  }
> = {
  pending: {
    label: '待验证',
    variant: 'secondary',
  },
  validating: {
    label: '验证中',
    variant: 'outline',
    showSpinner: true,
  },
  pending_index: {
    label: '待索引',
    variant: 'secondary',
  },
  indexing: {
    label: '索引中',
    variant: 'default',
    className: 'bg-blue-500 text-white',
    showSpinner: true,
  },
  indexed: {
    label: '已索引',
    variant: 'default',
    className: 'bg-green-600 text-white',
  },
  partial: {
    label: '部分索引',
    variant: 'outline',
    className: 'border-yellow-500 text-yellow-700',
  },
  failed: {
    label: '失败',
    variant: 'destructive',
  },
}

export function RepositoryStatusBadge({ status }: RepositoryStatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.showSpinner && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      {config.label}
    </Badge>
  )
}
