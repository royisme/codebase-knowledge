import { useSearch, Link } from '@tanstack/react-router'
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <CardHeader className='pb-4'>
        <CardTitle className='text-2xl font-bold tracking-tight text-center text-foreground'>
          企业登录
        </CardTitle>
        <CardDescription className='text-center text-muted-foreground'>
          登录 CIT 企业知识库管理平台
        </CardDescription>
      </CardHeader>
      <CardContent className='pb-4'>
        <UserAuthForm redirectTo={redirect} />
      </CardContent>
      <CardFooter className='flex flex-col gap-3 pt-4'>
        <div className='space-y-2 text-center'>
          <p className='text-sm text-muted-foreground'>
            还没有账户？
          </p>
          <Link
            to='/sign-up'
            className='inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80'
          >
            立即注册
            <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
          </Link>
        </div>
        <div className='h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent dark:via-primary/40' />
        <p className='text-center text-xs text-muted-foreground'>
          登录即表示您同意我们的{' '}
          <a
            href='/terms'
            className='text-primary underline underline-offset-4 transition-colors hover:text-primary/80'
          >
            服务条款
          </a>{' '}
          和{' '}
          <a
            href='/privacy'
            className='text-primary underline underline-offset-4 transition-colors hover:text-primary/80'
          >
            隐私政策
          </a>
        </p>
      </CardFooter>
    </AuthLayout>
  )
}
