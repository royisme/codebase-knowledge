import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ActionVerb,
  Identifier,
  PolicyRule,
  ResourceIdentifier,
  RoleAssignment,
  RoleDefinition,
} from '@/types'
import { toast } from 'sonner'
import {
  assignRole,
  fetchAuditLogs,
  fetchPolicies,
  fetchRoleMembers,
  fetchRoles,
  updatePolicy,
  type ListPoliciesResponse,
} from '@/lib/rbac-service'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminUsersPage } from '../users/admin-users-page'

type RolePolicyMap = Record<string, PolicyRule[]>

const DISPLAY_ACTIONS = ['read', 'admin'] as const satisfies ActionVerb[]
const ACTION_LABELS: Record<(typeof DISPLAY_ACTIONS)[number], string> = {
  read: '读取',
  admin: '管理',
}
const DISPLAY_ACTION_SET = new Set<ActionVerb>(DISPLAY_ACTIONS)

type RoleMember = RoleAssignment & { email: string; displayName: string }

export function RbacDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const queryClient = useQueryClient()

  const rolesQuery = useQuery({
    queryKey: ['rbac', 'roles'],
    queryFn: fetchRoles,
  })

  const policiesQuery = useQuery({
    queryKey: ['rbac', 'policies'],
    queryFn: fetchPolicies,
  })

  const auditsQuery = useQuery({
    queryKey: ['rbac', 'audits'],
    queryFn: fetchAuditLogs,
  })

  const membersQuery = useQuery({
    queryKey: ['rbac', 'members'],
    queryFn: fetchRoleMembers,
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
  const roleMembers = membersQuery.data ?? []
  const assignMutation = useMutation({
    mutationFn: assignRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'members'] })
      toast.success('角色已更新')
    },
    onError: () => {
      toast.error('角色更新失败')
    },
  })

  const rolePolicyMap = useMemo<RolePolicyMap>(() => {
    if (!policiesResponse) return {}
    const acc: RolePolicyMap = {}
    for (const policy of policiesResponse.policies) {
      acc[policy.roleId] = acc[policy.roleId] ?? []
      acc[policy.roleId].push(policy)
    }
    return acc
  }, [policiesResponse])

  const isLoading =
    rolesQuery.isLoading || policiesQuery.isLoading || auditsQuery.isLoading

  const resources =
    policiesResponse?.resources ??
    ({} as Record<ResourceIdentifier, ActionVerb[]>)

  if (isLoading) {
    return (
      <div className='grid gap-6 lg:grid-cols-2'>
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className='min-h-64 rounded-lg' />
        ))}
      </div>
    )
  }

  const roles = rolesQuery.data ?? []
  const audits = auditsQuery.data ?? []

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
      <TabsList>
        <TabsTrigger value='overview'>角色权限</TabsTrigger>
        <TabsTrigger value='users'>用户管理</TabsTrigger>
      </TabsList>

      <TabsContent value='overview' className='space-y-6'>
        <div className='grid gap-6 xl:grid-cols-[2fr,1fr]'>
          <div className='space-y-6'>
            <RoleMembersCard
              members={roleMembers as RoleMember[]}
              roles={roles}
              isLoading={membersQuery.isLoading}
              onAssign={(userId, roleId) =>
                assignMutation.mutate({ userId, roleId })
              }
              isSaving={assignMutation.isPending}
            />
            {roles.map((role) => (
              <RolePolicyCard
                key={role.id}
                role={role}
                policies={rolePolicyMap[role.id] ?? []}
                resourceActions={resources}
                isUpdating={mutation.isPending}
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

          <Card className='h-fit'>
            <CardHeader>
              <CardTitle>策略审计</CardTitle>
              <CardDescription>最近的角色与策略变更记录</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {audits.length === 0 ? (
                <p className='text-muted-foreground text-sm'>暂无审计记录。</p>
              ) : (
                <div className='space-y-4'>
                  {audits.map((log) => (
                    <div key={log.id} className='space-y-1'>
                      <div className='flex items-center justify-between text-sm font-medium'>
                        <span>{log.action}</span>
                        <span
                          className={
                            log.status === 'success'
                              ? 'text-muted-foreground'
                              : 'text-destructive'
                          }
                        >
                          {log.status === 'success' ? '成功' : '失败'}
                        </span>
                      </div>
                      <div className='text-muted-foreground text-xs'>
                        目标：{log.target}
                      </div>
                      <div className='text-muted-foreground text-xs'>
                        操作人：{log.actor} ·{' '}
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      {log.details ? (
                        <div className='text-muted-foreground text-xs'>
                          {log.details}
                        </div>
                      ) : null}
                      <Separator className='mt-3' />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value='users'>
        <AdminUsersPage />
      </TabsContent>
    </Tabs>
  )
}

interface RolePolicyCardProps {
  role: RoleDefinition
  policies: PolicyRule[]
  resourceActions: Record<ResourceIdentifier, ActionVerb[]>
  isUpdating: boolean
  onToggle: (resource: ResourceIdentifier, nextActions: ActionVerb[]) => void
}

interface RoleMembersCardProps {
  members: RoleMember[]
  roles: RoleDefinition[]
  isLoading: boolean
  isSaving: boolean
  onAssign: (userId: Identifier, roleId: Identifier) => void
}

function RoleMembersCard({
  members,
  roles,
  isLoading,
  isSaving,
  onAssign,
}: RoleMembersCardProps) {
  const roleOptions = roles.map((role) => ({ id: role.id, name: role.name }))
  return (
    <Card>
      <CardHeader>
        <CardTitle>角色成员</CardTitle>
        <CardDescription>查看并调整用户在 Mock 环境下的角色。</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='space-y-2'>
            <Skeleton className='h-9 w-full' />
            <Skeleton className='h-9 w-full' />
          </div>
        ) : (
          <div className='space-y-3'>
            {members.map((member) => (
              <div
                key={member.userId}
                className='flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm'
              >
                <div>
                  <div className='font-medium'>{member.displayName}</div>
                  <div className='text-muted-foreground text-xs'>
                    {member.email}
                  </div>
                </div>
                <Select
                  value={member.roleId}
                  onValueChange={(value) =>
                    onAssign(member.userId, value as Identifier)
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger size='sm' aria-label='角色选择'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            {members.length === 0 ? (
              <p className='text-muted-foreground text-sm'>暂无成员。</p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RolePolicyCard({
  role,
  policies,
  resourceActions,
  isUpdating,
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
    <Card>
      <CardHeader>
        <CardTitle>{role.name}</CardTitle>
        <CardDescription>{role.description}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {resources.length === 0 ? (
          <p className='text-muted-foreground text-sm'>暂无可配置的资源。</p>
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
                const currentActions = new Set(
                  getActionsFor(resource as ResourceIdentifier)
                )
                return (
                  <TableRow key={resource}>
                    <TableCell className='font-medium'>{resource}</TableCell>
                    {DISPLAY_ACTIONS.map((verb) => {
                      const disabled = !allowedActions.includes(verb)
                      const checked = currentActions.has(verb)
                      return (
                        <TableCell key={verb} className='text-center'>
                          <Switch
                            disabled={disabled || isUpdating}
                            checked={checked}
                            onCheckedChange={(value) =>
                              handleToggle(
                                resource as ResourceIdentifier,
                                verb,
                                value
                              )
                            }
                            aria-label={`${resource}:${verb}`}
                            className={cn(
                              disabled && 'cursor-not-allowed opacity-30'
                            )}
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
