import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './button'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({
  title = '数据加载失败',
  description = '请稍后再试，或联系管理员查看服务状态。',
  onRetry,
  retryLabel = '重试',
}: ErrorStateProps) {
  return (
    <div className='flex flex-col items-center justify-center gap-3 py-12 text-center'>
      <div className='bg-destructive/10 text-destructive flex h-12 w-12 items-center justify-center rounded-full'>
        <AlertCircle className='h-6 w-6' />
      </div>
      <div>
        <h3 className='text-foreground text-sm font-semibold'>{title}</h3>
        {description && (
          <p className='text-muted-foreground mt-1 text-sm'>{description}</p>
        )}
      </div>
      {onRetry && (
        <Button variant='outline' size='sm' onClick={onRetry}>
          <RefreshCw className='mr-2 h-4 w-4' />
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
