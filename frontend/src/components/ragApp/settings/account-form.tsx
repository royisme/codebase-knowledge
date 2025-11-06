import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const accountFormSchema = z.object({
  fullName: z
    .string()
    .min(1, '请输入姓名')
    .min(2, '姓名至少需要 2 个字符')
    .max(50, '姓名不能超过 50 个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  company: z
    .string()
    .max(100, '公司名称不能超过 100 个字符')
    .optional()
    .or(z.literal('')),
  department: z
    .string()
    .max(100, '部门名称不能超过 100 个字符')
    .optional()
    .or(z.literal('')),
})

type AccountFormValues = z.infer<typeof accountFormSchema>

export function AccountForm() {
  const user = useAuthStore((state) => state.auth.user)
  const setUser = useAuthStore((state) => state.auth.setUser)

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      company: user?.company || '',
      department: user?.department || '',
    },
  })

  async function onSubmit(data: AccountFormValues) {
    try {
      // TODO: 调用更新用户信息的 API
      // const updatedUser = await updateUserProfile(data)

      // 暂时只更新本地状态
      if (user) {
        setUser({
          ...user,
          fullName: data.fullName,
          company: data.company || null,
          department: data.department || null,
        })
      }

      toast.success('账号信息已更新')
    } catch (error) {
      toast.error('更新失败，请稍后重试')
      // eslint-disable-next-line no-console
      console.error('Failed to update profile:', error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='fullName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>姓名</FormLabel>
              <FormControl>
                <Input placeholder='请输入您的姓名' {...field} />
              </FormControl>
              <FormDescription>这是将在系统中显示的姓名</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input {...field} disabled />
              </FormControl>
              <FormDescription>邮箱地址不可修改，用于登录系统</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='company'
          render={({ field }) => (
            <FormItem>
              <FormLabel>公司（可选）</FormLabel>
              <FormControl>
                <Input placeholder='请输入公司名称' {...field} />
              </FormControl>
              <FormDescription>您所在的公司或组织</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='department'
          render={({ field }) => (
            <FormItem>
              <FormLabel>部门（可选）</FormLabel>
              <FormControl>
                <Input placeholder='请输入部门名称' {...field} />
              </FormControl>
              <FormDescription>您所在的部门或团队</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit'>保存更改</Button>
      </form>
    </Form>
  )
}
