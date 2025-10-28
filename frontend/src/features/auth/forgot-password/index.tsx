import { Link } from '@tanstack/react-router'
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { ForgotPasswordForm } from './components/forgot-password-form'

export function ForgotPassword() {
  return (
    <AuthLayout>
      <CardHeader className='pb-4'>
        <CardTitle className='text-2xl font-bold tracking-tight text-center text-foreground'>
          重置密码
        </CardTitle>
        <CardDescription className='text-center text-muted-foreground'>
          输入注册邮箱，我们将发送重置链接
        </CardDescription>
      </CardHeader>
      <CardContent className='pb-4'>
        <ForgotPasswordForm />
      </CardContent>
      <CardFooter className='flex flex-col gap-3 pt-4'>
        <div className='space-y-2 text-center'>
          <p className='text-sm text-muted-foreground'>
            记起密码了？
          </p>
          <Link
            to='/sign-in'
            className='inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80'
          >
            <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
            </svg>
            返回登录
          </Link>
        </div>
        <div className='h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent dark:via-primary/40' />
        <p className='text-center text-xs text-muted-foreground'>
          没有账户？{' '}
          <Link
            to='/sign-up'
            className='text-primary underline underline-offset-4 transition-colors hover:text-primary/80'
          >
            立即注册
          </Link>
        </p>
      </CardFooter>
    </AuthLayout>
  )
}
