import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn, Shield, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { signIn } from '@/lib/auth-service'
import { handleServerError } from '@/lib/handle-server-error'
import { cn } from '@/lib/utils'
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

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? '请输入邮箱地址' : undefined),
  }),
  password: z
    .string()
    .min(1, '请输入密码')
    .min(7, '密码长度至少7个字符'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const auth = useAuthStore((state) => state.auth)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const loginPromise = signIn(data)
      toast.promise(loginPromise, {
        loading: '正在登录…',
        success: `欢迎回来，${data.email}!`,
        error: (error) => {
          handleServerError(error)
          if (typeof error === 'object' && error && 'message' in error) {
            return (error as { message: string }).message ?? '登录失败'
          }
          return '登录失败，请检查账号或密码'
        },
      })

      const authResponse = await loginPromise

      auth.setAuth(authResponse)

      const targetPath = redirectTo || '/'
      navigate({ to: targetPath, replace: true })
    } catch (_error) {
      // 错误已在 toast.promise 的 error 回调中处理，这里保持捕获避免控制台噪音
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱地址</FormLabel>
              <FormControl>
                <Input placeholder='name@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='text-muted-foreground absolute end-0 -top-0.5 text-sm font-medium hover:opacity-75'
              >
                忘记密码？
              </Link>
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          登录
        </Button>

        <div className='relative my-2'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background text-muted-foreground px-2'>
              企业认证方式
            </span>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-2'>
          <Button
            variant='outline'
            type='button'
            disabled={isLoading}
            onClick={() => {
              const email = form.getValues('email')
              const company = email.includes('@') ? email.split('@')[1] : ''
              navigate({
                to: '/ldap',
                search: { email, company }
              })
            }}
          >
            <Shield className='mr-2 h-4 w-4' />
            使用 LDAP 认证
          </Button>
          <Button
            variant='outline'
            type='button'
            disabled={isLoading}
            onClick={() => navigate({ to: '/sign-up' })}
          >
            <Users className='mr-2 h-4 w-4' />
            注册企业账户
          </Button>
        </div>
      </form>
    </Form>
  )
}
