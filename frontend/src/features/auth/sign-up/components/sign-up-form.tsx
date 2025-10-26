import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { signUp } from '@/lib/auth-service'
import { handleServerError } from '@/lib/handle-server-error'
import { useAuthStore } from '@/stores/auth-store'
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
    displayName: z
      .string()
      .min(1, '请输入姓名')
      .max(60, '姓名过长'),
    email: z.email({
      error: (iss) =>
        iss.input === '' ? '请输入邮箱地址' : undefined,
    }),
    password: z
      .string()
      .min(1, '请输入密码')
      .min(7, '密码长度至少7个字符'),
    confirmPassword: z.string().min(1, '请确认密码'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
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
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    const payload = {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      displayName: data.displayName,
    }

    const submission = signUp(payload)

    toast.promise(submission, {
      loading: '正在创建账号…',
      success: `欢迎来到系统，${data.displayName}!`,
      error: (error) => {
        handleServerError(error)
        if (typeof error === 'object' && error && 'message' in error) {
          return (error as { message: string }).message ?? '注册失败'
        }
        return '注册失败，请稍后再试'
      },
    })

    try {
      const response = await submission
      auth.setAuth(response)
      navigate({ to: '/', replace: true })
    } catch (_error) {
      // 错误已在 toast 中处理
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
          name='displayName'
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
          <Button variant='outline' type='button' disabled={isLoading} onClick={() => toast.info('请联系管理员开通账户')}>
            联系管理员开通
          </Button>
        </div>
      </form>
    </Form>
  )
}
