import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { updateRepository, triggerIndex } from '@/lib/repository-service'
import type { Repository } from '@/types/repository'
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

const formSchema = z.object({
  name: z.string().min(1, '请输入仓库名称').max(100),
  description: z.string().optional(),
  access_token: z.string().optional(),
  include_patterns: z.string(),
  exclude_patterns: z.string(),
  max_file_size_kb: z.number().min(1).max(5000),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface EditRepositoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repository: Repository | null
  onSuccess?: () => void
}

export function EditRepositoryDialog({
  open,
  onOpenChange,
  repository,
  onSuccess,
}: EditRepositoryDialogProps) {
  const [showReindexDialog, setShowReindexDialog] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      access_token: '',
      include_patterns: '*.py,*.ts,*.js,*.go',
      exclude_patterns: 'node_modules/*,*.test.*',
      max_file_size_kb: 500,
      is_active: true,
    },
  })

  // 当 repository 改变时更新表单
  useEffect(() => {
    if (repository) {
      form.reset({
        name: repository.name,
        description: repository.description || '',
        access_token: '', // 不回显 token，用户需要重新输入
        include_patterns:
          repository.connection_config.include_patterns?.join(',') ||
          '*.py,*.ts,*.js,*.go',
        exclude_patterns:
          repository.connection_config.exclude_patterns?.join(',') ||
          'node_modules/*,*.test.*',
        max_file_size_kb:
          repository.connection_config.max_file_size_kb || 500,
        is_active: repository.is_active,
      })
    }
  }, [repository, form])

  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!repository) throw new Error('仓库不存在')

      const updateData = {
        name: values.name,
        description: values.description,
        is_active: values.is_active,
        connection_config: {
          ...(values.access_token && { access_token: values.access_token }),
          include_patterns: values.include_patterns
            .split(',')
            .map((s) => s.trim()),
          exclude_patterns: values.exclude_patterns
            .split(',')
            .map((s) => s.trim()),
          max_file_size_kb: values.max_file_size_kb,
        },
      }

      return updateRepository(repository.id, updateData)
    },
    onSuccess: () => {
      toast.success('仓库信息已更新')
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
      
      // 如果连接配置有变更，询问是否重新索引
      const hasConfigChange =
        form.formState.dirtyFields.access_token ||
        form.formState.dirtyFields.include_patterns ||
        form.formState.dirtyFields.exclude_patterns ||
        form.formState.dirtyFields.max_file_size_kb

      if (hasConfigChange) {
        setShowReindexDialog(true)
      } else {
        handleClose()
      }
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`)
    },
  })

  const reindexMutation = useMutation({
    mutationFn: async () => {
      if (!repository) throw new Error('仓库不存在')
      return triggerIndex(repository.id, { force_full: true })
    },
    onSuccess: () => {
      toast.success('已触发重新索引')
      setShowReindexDialog(false)
      handleClose()
    },
    onError: (error: Error) => {
      toast.error(`触发索引失败: ${error.message}`)
    },
  })

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
    if (onSuccess) {
      onSuccess()
    }
  }

  const onSubmit = (values: FormValues) => {
    updateMutation.mutate(values)
  }

  const handleReindexConfirm = () => {
    reindexMutation.mutate()
  }

  const handleReindexSkip = () => {
    setShowReindexDialog(false)
    handleClose()
  }

  if (!repository) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑仓库</DialogTitle>
            <DialogDescription>
              修改仓库配置。Git URL 和分支在创建后无法修改。
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* 仓库名称 */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>仓库名称 *</FormLabel>
                    <FormControl>
                      <Input placeholder="例如: Core API" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 描述 */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>描述</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="可选的仓库描述"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 不可编辑字段的显示 */}
              <div className="rounded-md border p-4 bg-muted/50 space-y-2">
                <div>
                  <p className="text-sm font-medium">Git URL（不可修改）</p>
                  <p className="text-sm text-muted-foreground">
                    {repository.connection_config.repo_url}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">分支（不可修改）</p>
                  <p className="text-sm text-muted-foreground">
                    {repository.connection_config.branch}
                  </p>
                </div>
              </div>

              {/* Access Token */}
              {repository.connection_config.auth_type === 'token' && (
                <FormField
                  control={form.control}
                  name="access_token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>访问令牌</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="留空表示不修改"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        如需更新 Token，请输入新的值；留空则保持原 Token 不变
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* 包含文件模式 */}
              <FormField
                control={form.control}
                name="include_patterns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>包含文件模式</FormLabel>
                    <FormControl>
                      <Input placeholder="*.py,*.ts,*.js,*.go" {...field} />
                    </FormControl>
                    <FormDescription>
                      逗号分隔，支持通配符（例如 *.py, src/*.ts）
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 排除文件模式 */}
              <FormField
                control={form.control}
                name="exclude_patterns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>排除文件模式</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="node_modules/*,*.test.*"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      逗号分隔，支持通配符
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 最大文件大小 */}
              <FormField
                control={form.control}
                name="max_file_size_kb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>最大文件大小 (KB)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number.parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      超过此大小的文件将被跳过
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 激活状态 */}
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">激活状态</FormLabel>
                      <FormDescription>
                        禁用后该仓库将不出现在可选列表中
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={updateMutation.isPending}
                >
                  取消
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  保存
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 重新索引确认对话框 */}
      <AlertDialog open={showReindexDialog} onOpenChange={setShowReindexDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>是否重新索引？</AlertDialogTitle>
            <AlertDialogDescription>
              您修改了连接配置（Token、文件模式等），这些更改需要重新索引才能生效。是否立即触发全量索引？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleReindexSkip}>
              稍后手动触发
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReindexConfirm}
              disabled={reindexMutation.isPending}
            >
              {reindexMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              立即索引
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
