import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

import type { KnowledgeSource } from '@/types'

const formSchema = z.object({
  name: z.string().min(1, '请输入知识源名称'),
  repositoryUrl: z
    .string()
    .min(1, '请输入仓库地址')
    .url('请输入合法的仓库地址，如 git@github.com:org/repo.git'),
  defaultBranch: z.string().min(1, '请输入默认分支'),
  credentialMode: z.enum(['ssh', 'https', 'token']),
  languages: z.string().min(1, '请输入至少一个解析语言'),
  pathAllowList: z.string().optional(),
  maxDepth: z
    .string()
    .optional()
    .refine(
      (val) => (val == null || val === '' || Number.isFinite(Number(val))),
      '请输入合法的数字'
    ),
  enableIncrementalRefresh: z.boolean(),
})

export type KnowledgeSourceFormValues = z.infer<typeof formSchema>

interface KnowledgeSourceFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initialData?: KnowledgeSource
  onSubmit: (values: KnowledgeSourceFormValues) => Promise<void> | void
  onOpenChange: (open: boolean) => void
  isSubmitting?: boolean
}

export function KnowledgeSourceFormDialog({
  open,
  onOpenChange,
  initialData,
  mode,
  onSubmit,
  isSubmitting,
}: KnowledgeSourceFormDialogProps) {
  const form = useForm<KnowledgeSourceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      repositoryUrl: initialData?.repositoryUrl ?? '',
      defaultBranch: initialData?.defaultBranch ?? 'main',
      credentialMode: initialData?.credentialMode ?? 'ssh',
      languages: initialData
        ? initialData.parserConfig.languages.join(', ')
        : 'python, typescript',
      pathAllowList: initialData?.parserConfig.pathAllowList?.join(', '),
      maxDepth: initialData?.parserConfig.maxDepth
        ? String(initialData.parserConfig.maxDepth)
        : '',
      enableIncrementalRefresh:
        initialData?.parserConfig.enableIncrementalRefresh ?? true,
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: initialData?.name ?? '',
      repositoryUrl: initialData?.repositoryUrl ?? '',
      defaultBranch: initialData?.defaultBranch ?? 'main',
      credentialMode: initialData?.credentialMode ?? 'ssh',
      languages: initialData
        ? initialData.parserConfig.languages.join(', ')
        : 'python, typescript',
      pathAllowList: initialData?.parserConfig.pathAllowList?.join(', '),
      maxDepth: initialData?.parserConfig.maxDepth
        ? String(initialData.parserConfig.maxDepth)
        : '',
      enableIncrementalRefresh:
        initialData?.parserConfig.enableIncrementalRefresh ?? true,
    })
  }, [open, initialData, form])

  const title = mode === 'create' ? '新增知识源' : '编辑知识源'
  const description =
    mode === 'create'
      ? '添加一个新的代码仓库作为知识源。'
      : '更新知识源的元数据与解析配置。'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className='grid gap-6 md:grid-cols-2'
            onSubmit={form.handleSubmit(async (values) => {
              await onSubmit(values)
            })}
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem className='md:col-span-1'>
                  <FormLabel>知识源名称</FormLabel>
                  <FormControl>
                    <Input placeholder='例如：Core API Service' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='repositoryUrl'
              render={({ field }) => (
                <FormItem className='md:col-span-1'>
                  <FormLabel>仓库地址</FormLabel>
                  <FormControl>
                    <Input placeholder='git@github.com:org/repo.git' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='defaultBranch'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>默认分支</FormLabel>
                  <FormControl>
                    <Input placeholder='main / develop / release' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='credentialMode'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>凭据模式</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='选择凭据模式' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='ssh'>SSH</SelectItem>
                      <SelectItem value='https'>HTTPS</SelectItem>
                      <SelectItem value='token'>Token</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='languages'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>解析语言（以逗号分隔）</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='例如：python, typescript, sql'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='pathAllowList'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>路径白名单（可选，以逗号分隔）</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='例如：backend/app, apps/frontend/src'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='maxDepth'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最大解析深度（可选）</FormLabel>
                  <FormControl>
                    <Input placeholder='默认 8，建议 1-12' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='enableIncrementalRefresh'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm md:col-span-2'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>启用增量刷新</FormLabel>
                    <p className='text-sm text-muted-foreground'>开启后可支持 webhook 增量解析。</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className='md:col-span-2'>
              <Button variant='outline' type='button' onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {mode === 'create' ? '提交' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
