import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import {
  createPolicy,
  deletePolicy,
  fetchPolicies,
  fetchRoles,
  updatePolicyAction,
  type ActionType,
  type RbacPolicy,
  type RbacRole,
} from '@/lib/rbac-service'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ErrorState } from '@/components/ui/error-state'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/layout/page-header'

const ACTION_OPTIONS: Array<{ value: ActionType; label: string }> = [
  { value: 'read', label: '读取' },
  { value: 'admin', label: '管理' },
]

export function PoliciesPage() {
  const queryClient = useQueryClient()
  const [newPolicy, setNewPolicy] = useState<{
    subject: string
    resource: string
    action: ActionType
  }>({
    subject: '',
    resource: '',
    action: 'read',
  })

  const rolesQuery = useQuery<RbacRole[]>({
    queryKey: ['rbac', 'roles'],
    queryFn: fetchRoles,
  })

  const policiesQuery = useQuery<RbacPolicy[]>({
    queryKey: ['rbac', 'policies'],
    queryFn: fetchPolicies,
  })

  useEffect(() => {
    if (rolesQuery.isError) {
      toast.error('角色数据加载失败，请稍后重试')
    }
  }, [rolesQuery.isError])

  useEffect(() => {
    if (policiesQuery.isError) {
      toast.error('策略列表加载失败，请稍后再试')
    }
  }, [policiesQuery.isError])

  const updateMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: ActionType }) =>
      updatePolicyAction(id, action),
    onSuccess: () => {
      toast.success('权限已更新')
      void queryClient.invalidateQueries({ queryKey: ['rbac', 'policies'] })
    },
    onError: () => {
      toast.error('更新权限失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePolicy(id),
    onSuccess: () => {
      toast.success('策略已删除')
      void queryClient.invalidateQueries({ queryKey: ['rbac', 'policies'] })
    },
    onError: () => {
      toast.error('删除策略失败')
    },
  })

  const createMutation = useMutation({
    mutationFn: () => createPolicy(newPolicy),
    onSuccess: () => {
      toast.success('策略已创建')
      void queryClient.invalidateQueries({ queryKey: ['rbac', 'policies'] })
      setNewPolicy({ subject: '', resource: '', action: 'read' })
    },
    onError: () => {
      toast.error('创建策略失败，请检查输入')
    },
  })

  const roles = rolesQuery.data ?? []
  const policies = policiesQuery.data ?? []

  const handleActionChange = (policy: RbacPolicy, action: ActionType) => {
    if (policy.action === action) return
    updateMutation.mutate({ id: policy.id, action })
  }

  const handleCreatePolicy = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newPolicy.subject || !newPolicy.resource) {
      toast.error('请填写角色与资源')
      return
    }
    createMutation.mutate()
  }

  return (
    <div className='space-y-6'>
      {/* 页面标题 */}
      <PageHeader
        title='权限策略'
        description='管理角色与资源的访问权限配置'
        icon={<ShieldCheck className='h-6 w-6' />}
      />

      <Card>
        <CardHeader>
          <CardTitle>新增策略</CardTitle>
          <CardDescription>为角色添加新的资源访问权限</CardDescription>
        </CardHeader>
        <CardContent>
          {rolesQuery.isError ? (
            <ErrorState
              title='无法加载角色数据'
              description='请刷新页面或稍后再试，若问题持续请联系平台团队。'
              onRetry={() => void rolesQuery.refetch()}
            />
          ) : (
            <form
              className='grid gap-4 md:grid-cols-4'
              onSubmit={handleCreatePolicy}
            >
              <Select
                value={newPolicy.subject}
                onValueChange={(value) =>
                  setNewPolicy((prev) => ({ ...prev, subject: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='选择角色' />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role: RbacRole) => (
                    <SelectItem key={role.name} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder='资源标识，如 knowledge_sources'
                value={newPolicy.resource}
                onChange={(event) =>
                  setNewPolicy((prev) => ({
                    ...prev,
                    resource: event.target.value,
                  }))
                }
                className='md:col-span-2'
              />

              <Select
                value={newPolicy.action}
                onValueChange={(value: ActionType) =>
                  setNewPolicy((prev) => ({ ...prev, action: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='选择动作' />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className='flex justify-end md:col-span-4'>
                <Button type='submit' disabled={createMutation.isPending}>
                  创建策略
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>策略列表</CardTitle>
          <CardDescription>查看并调整角色与资源的权限映射</CardDescription>
        </CardHeader>
        <CardContent>
          {policiesQuery.isError ? (
            <ErrorState
              title='无法加载策略列表'
              description='请检查网络或刷新重试，若多次失败请联系平台团队。'
              onRetry={() => void policiesQuery.refetch()}
            />
          ) : policies.length === 0 ? (
            <div className='text-muted-foreground py-12 text-center'>
              暂无策略
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>角色</TableHead>
                  <TableHead>资源</TableHead>
                  <TableHead>动作</TableHead>
                  <TableHead className='text-right'>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>{policy.subject}</TableCell>
                    <TableCell className='font-mono text-xs'>
                      {policy.resource}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={policy.action}
                        onValueChange={(value: ActionType) =>
                          handleActionChange(policy, value)
                        }
                        disabled={updateMutation.isPending}
                      >
                        <SelectTrigger className='w-[120px]'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => deleteMutation.mutate(policy.id)}
                        disabled={deleteMutation.isPending}
                      >
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
