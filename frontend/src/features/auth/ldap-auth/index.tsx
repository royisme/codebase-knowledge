import { Link } from '@tanstack/react-router'
import { Route } from '@/routes/(auth)/ldap'
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { LdapAuthForm } from './components/ldap-auth-form'

export function LdapAuth() {
  const { email, company } = Route.useSearch()

  return (
    <AuthLayout>
      <CardHeader className='pb-4'>
        <div className='mb-3 flex items-center justify-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-sky-500 shadow-lg shadow-primary/40'>
            <svg className='h-6 w-6 text-primary-foreground' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
            </svg>
          </div>
        </div>
        <CardTitle className='text-2xl font-bold tracking-tight text-center text-foreground'>
          企业 LDAP 认证
        </CardTitle>
        <CardDescription className='text-center text-muted-foreground'>
          通过企业目录服务验证身份
        </CardDescription>
      </CardHeader>
      <CardContent className='pb-4'>
        <LdapAuthForm email={email} company={company} />
      </CardContent>
      <CardFooter className='flex flex-col gap-3 pt-4'>
        <div className='space-y-2 text-center'>
          <p className='text-sm text-muted-foreground'>
            遇到问题？
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
          或使用其他认证方式
        </p>
      </CardFooter>
    </AuthLayout>
  )
}
