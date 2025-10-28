import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, Shield, ShieldCheck, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth-store'
import type { AuthResponse } from '@/types/auth'

const formSchema = z.object({
  password: z
    .string()
    .min(1, '请输入密码')
    .min(6, '密码长度至少6个字符'),
  domain: z.string().optional(),
})

interface LdapAuthFormProps {
  email?: string
  company?: string
}

export function LdapAuthForm({ email, company }: LdapAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [ldapStatus, setLdapStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting')
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
        success: 'LDAP 认证成功！',
        error: (error) => {
          setLdapStatus('failed')
          const errorMsg = error instanceof Error ? error.message : 'LDAP 认证失败'
          setLastError(errorMsg)
          return errorMsg
        },
      })

      const authResponse = await ldapPromise as AuthResponse

      setLdapStatus('connected')
      auth.setAuth(authResponse)

      // 登录成功后跳转
      navigate({ to: '/', replace: true })
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
        return <AlertCircle className='h-4 w-4 text-orange-500 animate-pulse' />
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        {/* LDAP 连接状态 */}
        <div className='flex items-center gap-2 rounded-md border bg-muted/30 p-3'>
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
                  placeholder='corp.company.com'
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
              <p className='text-xs text-muted-foreground mt-1'>
                请输入您的企业域名，系统将自动连接到对应的 LDAP 服务器
              </p>
              <div className='rounded bg-muted/50 border p-2 mt-2'>
                <p className='text-xs text-muted-foreground font-medium'>
                  💡 测试环境
                </p>
                <p className='text-xs text-muted-foreground mt-1'>
                  输入任意密码即可进行假认证
                </p>
              </div>
            </FormItem>
          )}
        />

        {/* 企业邮箱 (只读) */}
        <div className='space-y-2'>
          <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
            企业邮箱
          </label>
          <div className='flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm'>
            {email || 'user@corp.company.com'}
          </div>
          <p className='text-xs text-muted-foreground'>
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
              <div className='flex items-center gap-2 mt-2'>
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
        <Button
          type='submit'
          className='w-full'
          disabled={isLoading}
        >
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
        <div className='text-center space-y-2'>
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
          <div className='flex gap-2 justify-center'>
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
  )
}