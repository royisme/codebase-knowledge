import { Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Shield, Users, CheckCircle } from 'lucide-react'
import { AuthLayout } from '../auth-layout'
import { EnterpriseSignUpForm } from './components/enterprise-sign-up-form'

export function SignUp() {
  return (
    <AuthLayout>
      <Card className='gap-4 max-w-2xl w-full'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <Building2 className='h-6 w-6 text-primary' />
          </div>
          <CardTitle className='text-xl tracking-tight'>
            创建企业账户
          </CardTitle>
          <CardDescription className='space-y-2'>
            <p>
              通过企业 LDAP 认证创建知识库访问权限<br />
              三步完成企业账户注册流程
            </p>
            <div className='flex justify-center gap-2'>
              <Badge variant='secondary' className='text-xs'>
                <Shield className='mr-1 h-3 w-3' />
                LDAP 认证
              </Badge>
              <Badge variant='outline' className='text-xs'>
                <Users className='mr-1 h-3 w-3' />
                企业级安全
              </Badge>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnterpriseSignUpForm />
        </CardContent>
        <CardFooter className='flex flex-col gap-3'>
          <div className='rounded-lg border bg-muted/50 p-3 text-sm'>
            <h4 className='font-medium mb-2 flex items-center gap-2'>
              <CheckCircle className='h-4 w-4 text-green-600' />
              企业认证优势
            </h4>
            <ul className='space-y-1 text-xs text-muted-foreground'>
              <li>• 统一的企业身份认证管理</li>
              <li>• 高安全性 LDAP 目录服务</li>
              <li>• 自动权限分配和角色管理</li>
              <li>• 企业级数据安全保护</li>
            </ul>
          </div>

          <div className='text-center space-y-2'>
            <p className='text-muted-foreground text-sm'>
              已有企业账户？
            </p>
            <Link
              to='/sign-in'
              className='text-primary font-medium hover:underline underline-offset-4 text-sm'
            >
              立即登录
            </Link>
            <span className='text-muted-foreground mx-2'>•</span>
            <a
              href='/ldap'
              className='text-primary font-medium hover:underline underline-offset-4 text-sm'
            >
              LDAP 认证
            </a>
          </div>

          <p className='text-muted-foreground px-8 text-center text-xs'>
            By creating an account, you agree to our{' '}
            <a
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              Privacy Policy
            </a>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
