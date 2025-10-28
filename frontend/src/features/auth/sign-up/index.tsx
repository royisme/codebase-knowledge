import { Link } from '@tanstack/react-router'
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { EnterpriseSignUpForm } from './components/enterprise-sign-up-form'

export function SignUp() {
  return (
    <AuthLayout>
      <CardHeader className='pb-4'>
        <CardTitle className='text-2xl font-bold tracking-tight text-center text-white'>
          创建企业账户
        </CardTitle>
        <CardDescription className='text-center text-slate-300'>
          注册企业知识库访问权限
        </CardDescription>
      </CardHeader>
      <CardContent className='pb-4'>
        <EnterpriseSignUpForm />
      </CardContent>
      <CardFooter className='flex flex-col gap-3 pt-4'>
        <div className='text-center space-y-2'>
          <p className='text-slate-300 text-sm'>
            已有账户？
          </p>
          <Link
            to='/sign-in'
            className='inline-flex items-center gap-1 text-purple-400 font-medium hover:text-purple-300 transition-colors text-sm'
          >
            立即登录
            <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
          </Link>
        </div>
        <div className='h-px bg-gradient-to-r from-transparent via-white/20 to-transparent' />
        <p className='text-slate-400 text-center text-xs'>
          注册即表示您同意我们的{' '}
          <a
            href='/terms'
            className='text-purple-400 hover:text-purple-300 transition-colors underline underline-offset-4'
          >
            服务条款
          </a>{' '}
          和{' '}
          <a
            href='/privacy'
            className='text-purple-400 hover:text-purple-300 transition-colors underline underline-offset-4'
          >
            隐私政策
          </a>
        </p>
      </CardFooter>
    </AuthLayout>
  )
}
