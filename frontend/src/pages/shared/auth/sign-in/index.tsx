import { useSearch, Link } from '@tanstack/react-router'
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '@/components/layout/auth-layout'
import { UserAuthForm } from '@/components/ragApp/auth/user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <CardHeader className='pb-4'>
        <CardTitle className='text-foreground text-center text-2xl font-bold tracking-tight'>
          企业登录
        </CardTitle>
        <CardDescription className='text-muted-foreground text-center'>
          登录 CIT 企业知识库管理平台
        </CardDescription>
      </CardHeader>
      <CardContent className='pb-4'>
        <UserAuthForm redirectTo={redirect} />
      </CardContent>
      <CardFooter className='flex flex-col gap-3 pt-4'>
        <div className='space-y-2 text-center'>
          <p className='text-muted-foreground text-sm'>还没有账户？</p>
          <Link
            to='/sign-up'
            className='text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm font-medium transition-colors'
          >
            立即注册
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
                d='M9 5l7 7-7 7'
              />
            </svg>
          </Link>
        </div>
        <div className='via-primary/30 dark:via-primary/40 h-px bg-gradient-to-r from-transparent to-transparent' />
        <p className='text-muted-foreground text-center text-xs'>
          登录即表示您同意我们的{' '}
          <a
            href='/terms'
            className='text-primary hover:text-primary/80 underline underline-offset-4 transition-colors'
          >
            服务条款
          </a>{' '}
          和{' '}
          <a
            href='/privacy'
            className='text-primary hover:text-primary/80 underline underline-offset-4 transition-colors'
          >
            隐私政策
          </a>
        </p>
      </CardFooter>
    </AuthLayout>
  )
}
