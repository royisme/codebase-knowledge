import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { signUp, signIn } from '@/lib/auth-service'
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

const formSchema = z
  .object({
    fullName: z.string().min(1, '请输入姓名').max(60, '姓名过长'),
    email: z.email({
      error: (iss) => (iss.input === '' ? '请输入邮箱地址' : undefined),
    }),
    password: z.string().min(1, '请输入密码').min(7, '密码长度至少7个字符'),
    confirmPassword: z.string().min(1, '请确认密码'),
    company: z.string().optional(),
    department: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  })

export function SignUpForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const auth = useAuthStore((state) => state.auth)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      company: '',
      department: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    const payload = {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      fullName: data.fullName,
      company: data.company || '',
      department: data.department || '',
    }

    try {
      // Register the user (registration returns UserRead without tokens)
      const user = await signUp(payload)

      toast.success(`注册成功！欢迎 ${user.fullName}`, {
        duration: 4000,
        action: {
          label: '立即登录',
          onClick: async () => {
            try {
              toast.loading('正在登录...', { id: 'auto-login' })
              const loginResponse = await signIn({
                email: data.email,
                password: data.password,
              })

              toast.success('登录成功！', { id: 'auto-login' })
              auth.setAuth(loginResponse)
              navigate({ to: '/', replace: true })
            } catch (_loginError) {
              toast.error('自动登录失败，请手动登录', { id: 'auto-login' })
              navigate({ to: '/sign-in' })
            }
          },
        },
      })

      // Also show manual login option after timeout
      setTimeout(() => {
        toast.info('您也可以稍后手动登录', {
          action: {
            label: '去登录页面',
            onClick: () => navigate({ to: '/sign-in' }),
          },
        })
      }, 5000)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || '注册失败，请稍后再试')
      } else {
        toast.error('注册失败，请稍后再试')
      }
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
          name='fullName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>姓名</FormLabel>
              <FormControl>
                <Input placeholder='张三' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name='company'
          render={({ field }) => (
            <FormItem>
              <FormLabel>公司</FormLabel>
              <FormControl>
                <Input placeholder='CIT Corporation (可选)' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='department'
          render={({ field }) => (
            <FormItem>
              <FormLabel>部门</FormLabel>
              <FormControl>
                <Input placeholder='技术部 (可选)' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>确认密码</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          创建账户
        </Button>

        <div className='relative my-2'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background text-muted-foreground px-2'>
              如需开通账户，请联系管理员
            </span>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-2'>
          <Button
            variant='outline'
            type='button'
            disabled={isLoading}
            onClick={() => toast.info('请联系管理员开通账户')}
          >
            联系管理员开通
          </Button>
        </div>
      </form>
    </Form>
  )
}
