import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import type { AuthResponse } from '@/types/auth'
import {
  Loader2,
  Shield,
  ShieldCheck,
  AlertCircle,
  MousePointer,
  CheckCircle2,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { PasswordInput } from '@/components/password-input'

const formSchema = z.object({
  password: z.string().min(1, '请输入密码').min(6, '密码长度至少6个字符'),
  domain: z.string().optional(),
})

interface LdapAuthFormProps {
  email?: string
  company?: string
}

export function LdapAuthForm({ email, company }: LdapAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [ldapStatus, setLdapStatus] = useState<
    'connecting' | 'connected' | 'failed'
  >('connecting')
  const [lastError, setLastError] = useState<string>('')
  const navigate = useNavigate()
  const auth = useAuthStore((state) => state.auth)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      domain: company || 'corp.company.com',
    },
  })

  // 模拟 LDAP 连接检查
  useState(() => {
    const timer = setTimeout(() => {
      setLdapStatus('connected')
    }, 1500)
    return () => clearTimeout(timer)
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setLdapStatus('connecting')
    setLastError('')

    try {
      // 简化的假认证逻辑 - 只要有密码就成功
      const ldapPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          if (data.password.trim()) {
            // 假认证成功 - 只要有密码就行
            const now = new Date().toISOString()
            resolve({
              user: {
                id: 'ldap-user-' + Date.now(),
                email: email || `user@${data.domain || 'corp.company.com'}`,
                fullName: '企业用户',
                roles: ['viewer'],
                department: '企业部门',
                company: company || 'CIT Corporation',
                createdAt: now,
                updatedAt: now,
                createdBy: 'ldap',
                updatedBy: 'ldap',
                lastLoginAt: now,
              },
              token: {
                accessToken: 'mock-ldap-token-' + Date.now(),
                refreshToken: 'mock-refresh-token-' + Date.now(),
                expiresAt: new Date(Date.now() + 3600000).toISOString(),
              },
            })
          } else {
            reject(new Error('LDAP 认证失败：密码不能为空'))
          }
        }, 1000) // 快速响应
      })

      toast.promise(ldapPromise, {
        loading: '正在进行 LDAP 认证...',
        success: '演示认证成功！实际环境中将连接到企业 LDAP 服务器',
        error: (error) => {
          setLdapStatus('failed')
          const errorMsg =
            error instanceof Error ? error.message : 'LDAP 认证失败'
          setLastError(errorMsg)
          return errorMsg
        },
      })

      const authResponse = (await ldapPromise) as AuthResponse

      setLdapStatus('connected')
      auth.setAuth(authResponse)

      // 登录成功后跳转
      void navigate({ to: '/', replace: true })
    } catch {
      // 错误已在 toast.promise 的 error 回调中处理
      // 重置状态，允许用户重新尝试
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (ldapStatus) {
      case 'connecting':
        return <AlertCircle className='h-4 w-4 animate-pulse text-orange-500' />
      case 'connected':
        return <ShieldCheck className='h-4 w-4 text-green-600' />
      case 'failed':
        return <AlertCircle className='h-4 w-4 text-red-500' />
      default:
        return <AlertCircle className='h-4 w-4 text-gray-400' />
    }
  }

  const getStatusText = () => {
    switch (ldapStatus) {
      case 'connecting':
        return '正在连接 LDAP 服务器...'
      case 'connected':
        return 'LDAP 服务器连接成功'
      case 'failed':
        return lastError || 'LDAP 认证失败，请重试'
      default:
        return '检查 LDAP 连接状态'
    }
  }

  // 重置错误状态的函数
  const resetError = () => {
    if (ldapStatus === 'failed') {
      setLdapStatus('connected')
      setLastError('')
    }
  }

  return (
    <div className='space-y-4'>
      {/* 演示账号卡片 */}
      <Card className='border-dashed border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30'>
        <CardHeader className='pt-4 pb-3'>
          <CardTitle className='flex items-center gap-2 text-sm font-medium'>
            <svg
              className='h-4 w-4 text-blue-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            演示账号信息
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 pb-4'>
          <div className='space-y-2 text-sm'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>企业域名：</span>
              <code className='bg-muted rounded px-2 py-0.5 text-xs'>
                corp.example.com
              </code>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>认证密码：</span>
              <code className='bg-muted rounded px-2 py-0.5 text-xs'>
                任意密码
              </code>
            </div>
            <Separator className='my-2' />
            <Button
              type='button'
              size='sm'
              variant='ghost'
              className='w-full text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
              onClick={() => {
                form.setValue('domain', 'corp.example.com')
                form.setValue('password', 'Demo2024!')
                toast.success('已填充演示数据')
              }}
            >
              <MousePointer className='mr-2 h-3 w-3' />
              一键填充演示数据
            </Button>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          {/* LDAP 连接状态 */}
          <div className='bg-muted/30 flex items-center gap-2 rounded-md border p-3'>
            {getStatusIcon()}
            <span className='text-sm'>{getStatusText()}</span>
          </div>

          {/* 企业域名 */}
          <FormField
            control={form.control}
            name='domain'
            render={({ field }) => (
              <FormItem>
                <FormLabel>企业域名</FormLabel>
                <FormControl>
                  <Input
                    placeholder='corp.example.com'
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
                <p className='text-muted-foreground mt-1 text-xs'>
                  在生产环境中，系统将自动连接到您配置的企业 LDAP 服务器
                </p>
              </FormItem>
            )}
          />

          {/* 企业邮箱 (只读) */}
          <div className='space-y-2'>
            <label className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              企业邮箱
            </label>
            <div className='border-input bg-muted flex h-10 w-full rounded-md border px-3 py-2 text-sm'>
              {email || 'user@corp.example.com'}
            </div>
            <p className='text-muted-foreground text-xs'>
              使用企业邮箱进行 LDAP 认证
            </p>
          </div>

          {/* LDAP 密码 */}
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>LDAP 密码</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder='请输入 LDAP 认证密码'
                    {...field}
                    disabled={isLoading}
                    onChange={(e) => {
                      field.onChange(e)
                      resetError() // 用户输入时重置错误状态
                    }}
                  />
                </FormControl>
                <FormMessage />
                <div className='mt-2 flex items-center gap-2'>
                  <Badge variant='outline' className='text-xs'>
                    <Shield className='mr-1 h-3 w-3' />
                    企业认证
                  </Badge>
                  <Badge variant='outline' className='text-xs'>
                    安全加密
                  </Badge>
                </div>
              </FormItem>
            )}
          />

          {/* 提交按钮 */}
          <Button type='submit' className='w-full' disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                LDAP 认证中...
              </>
            ) : (
              <>
                <Shield className='mr-2 h-4 w-4' />
                通过 LDAP 认证
              </>
            )}
          </Button>

          {/* 备用选项 */}
          <div className='space-y-2 text-center'>
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-background text-muted-foreground px-2'>
                  备用认证方式
                </span>
              </div>
            </div>
            <div className='flex justify-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                type='button'
                disabled={isLoading}
                onClick={() => navigate({ to: '/sign-in' })}
              >
                使用本地账户
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* 企业认证特性说明 */}
      <div className='bg-muted/30 rounded-lg border p-4'>
        <h3 className='mb-3 flex items-center gap-2 text-sm font-semibold'>
          <Building2 className='text-primary h-4 w-4' />
          企业级认证特性
        </h3>
        <div className='text-muted-foreground grid gap-2 text-sm'>
          <div className='flex items-start gap-2'>
            <CheckCircle2 className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-500' />
            <span>统一身份管理：与企业 AD/LDAP 无缝集成</span>
          </div>
          <div className='flex items-start gap-2'>
            <CheckCircle2 className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-500' />
            <span>单点登录：一次认证，多系统访问</span>
          </div>
          <div className='flex items-start gap-2'>
            <CheckCircle2 className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-500' />
            <span>安全合规：满足企业安全审计要求</span>
          </div>
          <div className='flex items-start gap-2'>
            <CheckCircle2 className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-500' />
            <span>权限同步：自动映射企业组织架构</span>
          </div>
        </div>
        <Separator className='my-3' />
        <p className='text-muted-foreground text-xs'>
          本演示展示了系统的企业认证集成能力。在生产环境中，将直接对接您的企业目录服务。
        </p>
      </div>
    </div>
  )
}
