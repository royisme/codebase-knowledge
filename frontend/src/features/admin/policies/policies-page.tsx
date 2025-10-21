import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type {
  ActionVerb,
  Identifier,
  PolicyRule,
  ResourceIdentifier,
  RoleDefinition,
} from '@/types'
import {
  fetchPolicies,
  fetchRoles,
  updatePolicy,
  type ListPoliciesResponse,
} from '@/lib/rbac-service'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Plus, Settings, Shield, FolderOpen, Users } from 'lucide-react'

const DISPLAY_ACTIONS = ['read', 'admin'] as const satisfies ActionVerb[]
const ACTION_LABELS: Record<(typeof DISPLAY_ACTIONS)[number], string> = {
  read: '读取',
  admin: '管理',
}
const DISPLAY_ACTION_SET = new Set<ActionVerb>(DISPLAY_ACTIONS)

const RESOURCE_LABELS: Record<ResourceIdentifier, string> = {
  knowledge_sources: '知识源',
  users: '用户',
  policies: '策略',
}

const RESOURCE_ICONS: Record<ResourceIdentifier, React.ReactNode> = {
  knowledge_sources: <FolderOpen className='h-4 w-4' />,
  users: <Users className='h-4 w-4' />,
  policies: <Shield className='h-4 w-4' />,
}

export function PoliciesPage() {
  const [selectedRole, setSelectedRole] = useState<Identifier | null>(null)
  const queryClient = useQueryClient()

  const rolesQuery = useQuery({
    queryKey: ['rbac', 'roles'],
    queryFn: fetchRoles,
  })

  const policiesQuery = useQuery({
    queryKey: ['rbac', 'policies'],
    queryFn: fetchPolicies,
  })

  const mutation = useMutation({
    mutationFn: updatePolicy,
    onSuccess: (updated) => {
      queryClient.setQueryData<ListPoliciesResponse | undefined>(
        ['rbac', 'policies'],
        (existing) => {
          if (!existing) return existing
          return {
            ...existing,
            policies: existing.policies.map((policy) =>
              policy.id === updated.id ? updated : policy
            ),
          }
        }
      )
      toast.success('权限已更新')
    },
    onError: () => {
      toast.error('权限更新失败')
    },
  })

  const policiesResponse = policiesQuery.data
  const resources = policiesResponse?.resources ?? ({} as Record<ResourceIdentifier, ActionVerb[]>)

  const rolePolicyMap = useMemo(() => {
    if (!policiesResponse) return {}
    const acc: Record<string, PolicyRule[]> = {}
    for (const policy of policiesResponse.policies) {
      acc[policy.roleId] = acc[policy.roleId] ?? []
      acc[policy.roleId].push(policy)
    }
    return acc
  }, [policiesResponse])

  const isLoading = rolesQuery.isLoading || policiesQuery.isLoading

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold'>策略管理</h1>
            <p className='text-muted-foreground'>管理角色与资源的权限策略</p>
          </div>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            新增策略
          </Button>
        </div>
        <div className='grid gap-6 lg:grid-cols-2'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className='min-h-64 rounded-lg' />
          ))}
        </div>
      </div>
    )
  }

  const roles = rolesQuery.data ?? []

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>策略管理</h1>
          <p className='text-muted-foreground'>管理角色与资源的权限策略</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <Settings className='mr-2 h-4 w-4' />
            批量操作
          </Button>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            新增策略
          </Button>
        </div>
      </div>

      {/* 资源树概览 */}
      <Card>
        <CardHeader>
          <CardTitle>资源权限概览</CardTitle>
          <CardDescription>查看所有资源的权限分配情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-3'>
            {Object.entries(resources).map(([resource, actions]) => (
              <div
                key={resource}
                className='flex items-center justify-between rounded-lg border p-4'
              >
                <div className='flex items-center space-x-3'>
                  {RESOURCE_ICONS[resource as ResourceIdentifier]}
                  <div>
                    <div className='font-medium'>
                      {RESOURCE_LABELS[resource as ResourceIdentifier]}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      {actions.length} 个可用操作
                    </div>
                  </div>
                </div>
                <div className='flex gap-1'>
                  {actions.map((action) => (
                    <Badge key={action} variant='secondary' className='text-xs'>
                      {ACTION_LABELS[action]}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 角色策略列表 */}
      <div className='space-y-4'>
        <h2 className='text-lg font-semibold'>角色策略详情</h2>
        <div className='grid gap-6'>
          {roles.map((role) => (
            <RolePolicyCard
              key={role.id}
              role={role}
              policies={rolePolicyMap[role.id] ?? []}
              resourceActions={resources}
              isUpdating={mutation.isPending}
              isSelected={selectedRole === role.id}
              onSelect={() => setSelectedRole(selectedRole === role.id ? null : role.id)}
              onToggle={(resource, nextActions) =>
                mutation.mutate({
                  roleId: role.id,
                  resource,
                  actions: nextActions,
                })
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface RolePolicyCardProps {
  role: RoleDefinition
  policies: PolicyRule[]
  resourceActions: Record<ResourceIdentifier, ActionVerb[]>
  isUpdating: boolean
  isSelected: boolean
  onSelect: () => void
  onToggle: (resource: ResourceIdentifier, nextActions: ActionVerb[]) => void
}

function RolePolicyCard({
  role,
  policies,
  resourceActions,
  isUpdating,
  isSelected,
  onSelect,
  onToggle,
}: RolePolicyCardProps) {
  const resources = Object.entries(resourceActions).filter(([, allowed]) =>
    allowed.some((action) => DISPLAY_ACTION_SET.has(action))
  )

  const getActionsFor = (resource: ResourceIdentifier): ActionVerb[] => {
    const record = policies.find((policy) => policy.resource === resource)
    return record?.actions ?? []
  }

  const handleToggle = (
    resource: ResourceIdentifier,
    action: ActionVerb,
    enabled: boolean
  ) => {
    const current = new Set(getActionsFor(resource))
    if (enabled) {
      current.add(action)
    } else {
      current.delete(action)
    }
    onToggle(resource, Array.from(current))
  }

  return (
    <Card className={cn(isSelected && 'ring-2 ring-primary')}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>{role.name}</CardTitle>
            <CardDescription>{role.description}</CardDescription>
          </div>
          <Button variant='ghost' size='sm' onClick={onSelect}>
            {isSelected ? '收起' : '展开'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {resources.length === 0 ? (
          <p className='text-sm text-muted-foreground'>暂无可配置的资源。</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>资源</TableHead>
                {DISPLAY_ACTIONS.map((action) => (
                  <TableHead key={action} className='text-center'>
                    {ACTION_LABELS[action]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map(([resource, allowedActions]) => {
                const currentActions = new Set(getActionsFor(resource as ResourceIdentifier))
                return (
                  <TableRow key={resource}>
                    <TableCell className='font-medium'>
                      <div className='flex items-center space-x-2'>
                        {RESOURCE_ICONS[resource as ResourceIdentifier]}
                        <span>{RESOURCE_LABELS[resource as ResourceIdentifier]}</span>
                      </div>
                    </TableCell>
                    {DISPLAY_ACTIONS.map((verb) => {
                      const disabled = !allowedActions.includes(verb)
                      const checked = currentActions.has(verb)
                      return (
                        <TableCell key={verb} className='text-center'>
                          <Switch
                            disabled={disabled || isUpdating}
                            checked={checked}
                            onCheckedChange={(value) =>
                              handleToggle(resource as ResourceIdentifier, verb, value)
                            }
                            aria-label={`${resource}:${verb}`}
                            className={cn(disabled && 'opacity-30 cursor-not-allowed')}
                          />
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}