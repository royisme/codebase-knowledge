import { AlertCircle, WifiOff, Clock, ShieldAlert, ServerCrash } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ErrorDisplayProps {
  error: string
  onRetry?: () => void
}

function getErrorType(error: string): 'network' | 'timeout' | 'permission' | 'system' | 'notfound' | 'default' {
  if (error.includes('网络')) return 'network'
  if (error.includes('超时')) return 'timeout'
  if (error.includes('权限')) return 'permission'
  if (error.includes('系统')) return 'system'
  if (error.includes('未找到')) return 'notfound'
  return 'default'
}

function getErrorTitle(errorType: string) {
  switch (errorType) {
    case 'network': return '网络错误'
    case 'timeout': return '查询超时'
    case 'permission': return '权限不足'
    case 'system': return '系统异常'
    case 'notfound': return '无结果'
    default: return '查询失败'
  }
}

function getErrorSuggestion(errorType: string) {
  switch (errorType) {
    case 'network': return '请检查网络连接后重试'
    case 'timeout': return '请尝试缩小查询范围或更换检索模式'
    case 'permission': return '请联系管理员获取访问权限'
    case 'system': return '请稍后重试或联系技术支持'
    case 'notfound': return '请尝试更换关键词或检索模式'
    default: return '请稍后重试'
  }
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  const errorType = getErrorType(error)
  const title = getErrorTitle(errorType)
  const suggestion = getErrorSuggestion(errorType)

  return (
    <Alert variant="destructive">
      {errorType === 'network' && <WifiOff className="h-4 w-4" />}
      {errorType === 'timeout' && <Clock className="h-4 w-4" />}
      {errorType === 'permission' && <ShieldAlert className="h-4 w-4" />}
      {errorType === 'system' && <ServerCrash className="h-4 w-4" />}
      {errorType !== 'network' && errorType !== 'timeout' && errorType !== 'permission' && errorType !== 'system' && (
        <AlertCircle className="h-4 w-4" />
      )}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          <p>{error}</p>
          <p className="text-sm">{suggestion}</p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2"
            >
              重试
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
