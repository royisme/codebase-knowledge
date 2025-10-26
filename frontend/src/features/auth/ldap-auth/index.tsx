import { Link } from '@tanstack/react-router'
import { Route } from '@/routes/(auth)/ldap'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, CheckCircle, AlertCircle, Building, Users } from 'lucide-react'
import { AuthLayout } from '../auth-layout'
import { LdapAuthForm } from './components/ldap-auth-form'

export function LdapAuth() {
  const { email, company } = Route.useSearch()

  return (
    <AuthLayout>
      <Card className='gap-4 max-w-2xl w-full'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <Building className='h-6 w-6 text-primary' />
          </div>
          <CardTitle className='text-xl tracking-tight'>
            企业 LDAP 认证
          </CardTitle>
          <CardDescription className='space-y-2'>
            <p>
              正在通过企业目录服务验证您的身份<br />
              请确认以下信息以完成认证流程
            </p>
            <div className='flex justify-center gap-2'>
              <Badge variant='secondary' className='text-xs'>
                <Shield className='mr-1 h-3 w-3' />
                安全认证
              </Badge>
              <Badge variant='outline' className='text-xs'>
                <Users className='mr-1 h-3 w-3' />
                企业账户
              </Badge>
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className='space-y-6'>
            {/* 认证信息确认 */}
            <div className='rounded-lg border bg-muted/50 p-4'>
              <h3 className='font-medium text-sm mb-3 flex items-center gap-2'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                待验证信息
              </h3>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between py-1'>
                  <span className='text-muted-foreground'>企业邮箱:</span>
                  <span className='font-medium'>{email || '未提供'}</span>
                </div>
                <div className='flex justify-between py-1'>
                  <span className='text-muted-foreground'>企业域名:</span>
                  <span className='font-medium'>{company || '未识别'}</span>
                </div>
              </div>
            </div>

            {/* LDAP 连接状态 */}
            <div className='rounded-lg border p-4'>
              <h3 className='font-medium text-sm mb-2 flex items-center gap-2'>
                <AlertCircle className='h-4 w-4 text-orange-500' />
                LDAP 服务器连接
              </h3>
              <p className='text-sm text-muted-foreground mb-3'>
                系统正在连接到企业 LDAP 目录服务进行身份验证
              </p>
              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-xs'>
                  <div className='h-2 w-2 rounded-full bg-green-500 animate-pulse'></div>
                  <span>ldap://corp.company.com:389</span>
                </div>
                <div className='flex items-center gap-2 text-xs'>
                  <div className='h-2 w-2 rounded-full bg-green-500 animate-pulse'></div>
                  <span>SSL/TLS 加密连接</span>
                </div>
              </div>
            </div>

            {/* 认证表单 */}
            <LdapAuthForm email={email} company={company} />
          </div>
        </CardContent>

        <CardFooter className='flex flex-col gap-3'>
          <p className='text-muted-foreground px-8 text-center text-sm'>
            遇到问题？请联系 IT 支持团队<br />
            或使用备用身份验证方式
          </p>
          <div className='flex gap-2 justify-center'>
            <Link
              to='/sign-in'
              className='text-muted-foreground text-sm font-medium hover:text-primary underline underline-offset-4'
            >
              返回登录
            </Link>
            <span className='text-muted-foreground'>•</span>
            <Link
              to='/sign-up'
              className='text-muted-foreground text-sm font-medium hover:text-primary underline underline-offset-4'
            >
              注册新账户
            </Link>
          </div>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}