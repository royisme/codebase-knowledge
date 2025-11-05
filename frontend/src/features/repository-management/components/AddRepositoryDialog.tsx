import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  validateRepository,
  createRepository,
  triggerIndex,
} from '@/lib/repository-service'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

const formSchema = z.object({
  name: z.string().min(1, '请输入仓库名称').max(100),
  description: z.string().optional(),
  repo_url: z
    .string()
    .min(1, '请输入 Git URL')
    .url('请输入有效的 URL')
    .refine((url) => url.startsWith('https://'), {
      message: '仅支持 HTTPS 协议',
    }),
  branch: z.string().min(1, '请输入分支名称'),
  auth_type: z.enum(['none', 'token']),
  access_token: z.string().optional(),
  include_patterns: z.string(),
  exclude_patterns: z.string(),
  max_file_size_kb: z.number().min(1).max(5000),
})

type FormValues = z.infer<typeof formSchema>

interface AddRepositoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddRepositoryDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddRepositoryDialogProps) {
  const [validationState, setValidationState] = useState<
    'idle' | 'validating' | 'success' | 'error'
  >('idle')
  const [validationMessage, setValidationMessage] = useState('')
  const [accessibleBranches, setAccessibleBranches] = useState<string[]>([])
  const [createdRepoId, setCreatedRepoId] = useState<string | null>(null)
  const [showIndexDialog, setShowIndexDialog] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      repo_url: '',
      branch: 'main',
      auth_type: 'none',
      access_token: '',
      include_patterns: '*.py,*.ts,*.js,*.go',
      exclude_patterns: 'node_modules/*,*.test.*',
      max_file_size_kb: 500,
    },
  })

  const validateMutation = useMutation({
    mutationFn: validateRepository,
    onMutate: () => {
      setValidationState('validating')
      setValidationMessage('')
    },
    onSuccess: (data) => {
      if (data.valid) {
        setValidationState('success')
        setValidationMessage('连接验证成功')
        if (data.accessible_branches && data.accessible_branches.length > 0) {
          setAccessibleBranches(data.accessible_branches)
          if (data.accessible_branches.includes('main')) {
            form.setValue('branch', 'main')
          } else if (data.accessible_branches[0]) {
            form.setValue('branch', data.accessible_branches[0])
          }
        }
      } else {
        setValidationState('error')
        setValidationMessage(data.message || '连接验证失败')
      }
    },
    onError: (error) => {
      setValidationState('error')
      setValidationMessage(error.message || '验证请求失败')
    },
  })

  const createMutation = useMutation({
    mutationFn: createRepository,
    onSuccess: (data) => {
      toast.success('仓库创建成功')
      setCreatedRepoId(data.id)
      setShowIndexDialog(true)
    },
    onError: () => {
      toast.error('创建仓库失败，请重试')
    },
  })

  const triggerIndexMutation = useMutation({
    mutationFn: (repoId: string) => triggerIndex(repoId, { force_full: true }),
    onSuccess: (data) => {
      const jobInfo = data.job_id ? `（ID: ${data.job_id.slice(0, 8)}）` : ''
      toast.success(`${data.message ?? '索引任务已创建'}${jobInfo}`)
      handleClose()
      onSuccess?.()
    },
    onError: () => {
      toast.error('触发索引失败')
    },
  })

  const handleValidate = () => {
    const values = form.getValues()
    validateMutation.mutate({
      repo_url: values.repo_url,
      auth_type: values.auth_type,
      access_token:
        values.auth_type === 'token' ? values.access_token : undefined,
    })
  }

  const onSubmit = (values: FormValues) => {
    createMutation.mutate({
      name: values.name,
      description: values.description,
      source_type: 'code',
      connection_config: {
        repo_url: values.repo_url,
        branch: values.branch,
        auth_type: values.auth_type,
        access_token:
          values.auth_type === 'token' ? values.access_token : undefined,
        include_patterns: values.include_patterns
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        exclude_patterns: values.exclude_patterns
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        max_file_size_kb: values.max_file_size_kb,
      },
    })
  }

  const handleClose = () => {
    form.reset()
    setValidationState('idle')
    setValidationMessage('')
    setAccessibleBranches([])
    setCreatedRepoId(null)
    setShowIndexDialog(false)
    onOpenChange(false)
  }

  const handleIndexConfirm = () => {
    if (createdRepoId) {
      triggerIndexMutation.mutate(createdRepoId)
    }
  }

  const handleSkipIndex = () => {
    handleClose()
    onSuccess?.()
  }

  const authType = form.watch('auth_type')

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>添加代码仓库</DialogTitle>
            <DialogDescription>
              添加 GitHub 或 GitLab 仓库，系统将自动解析代码结构并构建知识图谱
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              {/* 基本信息 */}
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>仓库名称 *</FormLabel>
                    <FormControl>
                      <Input placeholder='例：core-api' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>描述</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='可选：描述仓库用途'
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Git 配置 */}
              <div className='space-y-4 rounded-lg border p-4'>
                <h3 className='font-medium'>Git 配置</h3>

                <FormField
                  control={form.control}
                  name='repo_url'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Git URL *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='https://github.com/org/repo.git'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='auth_type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>认证方式</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className='flex gap-4'
                        >
                          <div className='flex items-center space-x-2'>
                            <RadioGroupItem value='none' id='auth-none' />
                            <Label htmlFor='auth-none'>公开仓库</Label>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <RadioGroupItem value='token' id='auth-token' />
                            <Label htmlFor='auth-token'>
                              Personal Access Token
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {authType === 'token' && (
                  <FormField
                    control={form.control}
                    name='access_token'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access Token *</FormLabel>
                        <FormControl>
                          <Input
                            type='password'
                            placeholder='ghp_xxxxxxxxxxxx'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>需要 repo 读取权限</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name='branch'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>分支 *</FormLabel>
                      <FormControl>
                        <Input placeholder='main' {...field} />
                      </FormControl>
                      {accessibleBranches.length > 0 && (
                        <FormDescription>
                          可访问分支：{accessibleBranches.join(', ')}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 验证按钮 */}
                <div className='flex items-center gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleValidate}
                    disabled={
                      !form.getValues('repo_url') ||
                      validateMutation.isPending ||
                      validationState === 'success'
                    }
                  >
                    {validateMutation.isPending && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    {validationState === 'success' ? (
                      <CheckCircle2 className='mr-2 h-4 w-4 text-green-600' />
                    ) : validationState === 'error' ? (
                      <AlertCircle className='text-destructive mr-2 h-4 w-4' />
                    ) : null}
                    验证连接
                  </Button>
                  {validationMessage && (
                    <span
                      className={`text-sm ${
                        validationState === 'success'
                          ? 'text-green-600'
                          : 'text-destructive'
                      }`}
                    >
                      {validationMessage}
                    </span>
                  )}
                </div>
              </div>

              {/* 解析配置 */}
              <div className='space-y-4 rounded-lg border p-4'>
                <h3 className='font-medium'>解析配置</h3>

                <FormField
                  control={form.control}
                  name='include_patterns'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>包含文件模式</FormLabel>
                      <FormControl>
                        <Input placeholder='*.py,*.ts,*.js,*.go' {...field} />
                      </FormControl>
                      <FormDescription>逗号分隔，支持通配符</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='exclude_patterns'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>排除文件模式</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='node_modules/*,*.test.*'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='max_file_size_kb'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>最大文件大小（KB）</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={1}
                          max={5000}
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type='button' variant='outline' onClick={handleClose}>
                  取消
                </Button>
                <Button
                  type='submit'
                  disabled={
                    validationState !== 'success' || createMutation.isPending
                  }
                >
                  {createMutation.isPending && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  创建仓库
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 确认是否立即索引 */}
      <AlertDialog open={showIndexDialog} onOpenChange={setShowIndexDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>是否立即索引？</AlertDialogTitle>
            <AlertDialogDescription>
              仓库已创建成功。是否立即开始索引？索引可能需要几分钟到几小时，取决于仓库大小。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSkipIndex}>
              稍后索引
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleIndexConfirm}
              disabled={triggerIndexMutation.isPending}
            >
              {triggerIndexMutation.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              立即索引
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
