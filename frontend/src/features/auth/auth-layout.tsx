import { Logo } from '@/assets/logo'

import { AssignmentInfo } from './assignment-info'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='container flex min-h-svh max-w-none items-center justify-center px-4 py-10'>
      <div className='grid w-full max-w-5xl items-start gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]'>
        <div className='flex flex-col gap-6'>
          <div className='flex w-full justify-center lg:justify-start'>
            <div className='w-full max-w-sm'>
              <AssignmentInfo />
            </div>
          </div>
        </div>
        <div className='mx-auto flex w-full flex-col justify-center space-y-4 rounded-lg border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur-sm sm:max-w-[520px] sm:p-8'>
          <div className='flex items-center justify-center'>
            <Logo className='me-2' />
            <h1 className='text-xl font-medium'>企业知识库</h1>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
