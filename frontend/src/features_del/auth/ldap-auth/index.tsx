import { Link } from '@tanstack/react-router'
import { Route } from '@/routes/(auth)/ldap'
import { Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
      {/* 演示模式横幅 */}
      <Alert className='mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50'>
        <Info className='h-4 w-4 text-blue-600 dark:text-blue-400' />
        <AlertDescription className='ml-2 text-sm text-blue-700 dark:text-blue-300'>
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className='border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300'
            >
              演示模式
            </Badge>
            <span>体验企业级 LDAP 认证流程</span>
          </div>
        </AlertDescription>
      </Alert>

      <CardHeader className='pb-4'>
        <div className='mb-3 flex items-center justify-center'>
          <div className='from-primary shadow-primary/40 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br to-sky-500 shadow-lg'>
            <svg
              className='text-primary-foreground h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
              />
            </svg>
          </div>
        </div>
        <CardTitle className='text-foreground text-center text-2xl font-bold tracking-tight'>
          企业 LDAP 认证
          <span className='text-muted-foreground ml-2 text-sm font-normal'>
            （演示）
          </span>
        </CardTitle>
        <CardDescription className='text-muted-foreground text-center'>
          体验企业目录服务认证流程
        </CardDescription>
      </CardHeader>
      <CardContent className='pb-4'>
        <LdapAuthForm email={email} company={company} />
      </CardContent>
      <CardFooter className='flex flex-col gap-3 pt-4'>
        <div className='space-y-2 text-center'>
          <p className='text-muted-foreground text-sm'>遇到问题？</p>
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
          或使用其他认证方式
        </p>
      </CardFooter>
    </AuthLayout>
  )
}
