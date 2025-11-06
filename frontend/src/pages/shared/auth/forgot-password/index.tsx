import { Link } from '@tanstack/react-router'
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '@/components/layout/auth-layout'
import { ForgotPasswordForm } from '@/components/ragApp/auth/forgot-password-form'

export function ForgotPassword() {
  return (
    <AuthLayout>
      <CardHeader className='pb-4'>
        <CardTitle className='text-foreground text-center text-2xl font-bold tracking-tight'>
          重置密码
        </CardTitle>
        <CardDescription className='text-muted-foreground text-center'>
          输入注册邮箱，我们将发送重置链接
        </CardDescription>
      </CardHeader>
      <CardContent className='pb-4'>
        <ForgotPasswordForm />
      </CardContent>
      <CardFooter className='flex flex-col gap-3 pt-4'>
        <div className='space-y-2 text-center'>
          <p className='text-muted-foreground text-sm'>记起密码了？</p>
          <Link
            to='/sign-in'
            className='text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm font-medium transition-colors'
          >
            <svg
              className='h-4 w-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
            返回登录
          </Link>
        </div>
        <div className='via-primary/30 dark:via-primary/40 h-px bg-gradient-to-r from-transparent to-transparent' />
        <p className='text-muted-foreground text-center text-xs'>
          没有账户？{' '}
          <Link
            to='/sign-up'
            className='text-primary hover:text-primary/80 underline underline-offset-4 transition-colors'
          >
            立即注册
          </Link>
        </p>
      </CardFooter>
    </AuthLayout>
  )
}
