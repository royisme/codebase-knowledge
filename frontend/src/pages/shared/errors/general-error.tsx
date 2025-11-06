import {
  useNavigate,
  useRouter,
  useRouteContext,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { RefreshCw, Home, ArrowLeft, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type GeneralErrorProps = Partial<ErrorComponentProps> & {
  minimal?: boolean
  className?: string
}

export function GeneralError({
  error,
  reset: _reset,
  minimal = false,
  className,
}: GeneralErrorProps) {
  const navigate = useNavigate()
  const { history } = useRouter()
  const { queryClient } = useRouteContext({ from: '__root__' })

  const handleReload = () => {
    window.location.reload()
  }

  const handleClearCacheAndGoHome = async () => {
    // Clear all React Query caches
    queryClient.clear()
    // Small delay to ensure cache is cleared
    await new Promise((resolve) => setTimeout(resolve, 100))
    // Navigate to home
    await navigate({ to: '/' })
  }

  const handleGoBack = () => {
    history.go(-1)
  }

  const handleGoHome = () => {
    navigate({ to: '/' })
  }

  // Get error message
  const errorMessage = error instanceof Error ? error.message : String(error)

  return (
    <div className={cn('h-svh w-full', 'bg-background', className)}>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2 px-4'>
        {!minimal && (
          <div className='mb-4 flex flex-col items-center gap-2'>
            <AlertCircle className='text-destructive h-16 w-16' />
            <h1 className='text-[7rem] leading-tight font-bold'>500</h1>
          </div>
        )}
        <span className='font-medium'>Oops! Something went wrong {`:')`}</span>
        <p className='text-muted-foreground max-w-md text-center'>
          We apologize for the inconvenience. <br />
          You can try reloading the page or return to the home page.
        </p>

        {/* Development mode: show error details */}
        {import.meta.env.DEV && error && (
          <details className='mt-4 w-full max-w-2xl'>
            <summary className='text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors'>
              Show error details (dev mode)
            </summary>
            <div className='bg-muted mt-2 max-h-48 overflow-auto rounded-md p-4'>
              <p className='text-destructive font-mono text-xs break-all'>
                {errorMessage}
              </p>
              {error instanceof Error && error.stack && (
                <pre className='text-muted-foreground mt-2 font-mono text-xs break-all whitespace-pre-wrap'>
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}

        {!minimal && (
          <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center'>
            {/* Primary action: Reload page - most reliable recovery */}
            <Button onClick={handleReload} className='min-w-[160px] gap-2'>
              <RefreshCw className='h-4 w-4' />
              Reload Page
            </Button>

            {/* Secondary action: Clear cache and go home */}
            <Button
              variant='secondary'
              onClick={handleClearCacheAndGoHome}
              className='min-w-[160px] gap-2'
            >
              <Home className='h-4 w-4' />
              Clear Cache & Go Home
            </Button>

            {/* Tertiary actions: Navigation only */}
            <div className='flex w-full gap-2 sm:w-auto'>
              <Button
                variant='outline'
                onClick={handleGoBack}
                className='flex-1 gap-2 sm:flex-initial'
              >
                <ArrowLeft className='h-4 w-4' />
                Go Back
              </Button>
              <Button
                variant='ghost'
                onClick={handleGoHome}
                className='flex-1 sm:flex-initial'
              >
                Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
