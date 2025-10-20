import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { verifyOtp } from '@/lib/auth-service'
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'

const formSchema = z.object({
  otp: z
    .string()
    .min(6, 'Please enter the 6-digit code.')
    .max(6, 'Please enter the 6-digit code.'),
})

interface OtpFormProps extends React.HTMLAttributes<HTMLFormElement> {
  email?: string
}

export function OtpForm({ className, email, ...props }: OtpFormProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const auth = useAuthStore((state) => state.auth)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: '' },
  })

  const otp = form.watch('otp')

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!email) {
      toast.error('请先完成邮箱验证流程')
      return
    }
    setIsLoading(true)
    const payload = { email, otp: data.otp }
    const verification = verifyOtp(payload)
    toast.promise(verification, {
      loading: '正在验证…',
      success: '验证成功，正在登录',
      error: (error) => {
        handleServerError(error)
        if (typeof error === 'object' && error && 'message' in error) {
          return (error as { message: string }).message ?? '验证码错误'
        }
        return '验证码错误或已过期'
      },
    })

    try {
      const response = await verification
      auth.setAuth(response)
      navigate({ to: '/', replace: true })
    } catch (_error) {
      // 错误提示已处理
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-2', className)}
        {...props}
      >
        {!email ? (
          <p className='text-sm text-muted-foreground'>请先通过注册或忘记密码流程获取验证码。</p>
        ) : null}
        <FormField
          control={form.control}
          name='otp'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='sr-only'>One-Time Password</FormLabel>
              <FormControl>
                <InputOTP
                  maxLength={6}
                  {...field}
                  containerClassName='justify-between sm:[&>[data-slot="input-otp-group"]>div]:w-12'
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={otp.length < 6 || isLoading || !email}>
          Verify
        </Button>
      </form>
    </Form>
  )
}
