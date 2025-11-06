import { useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { zhCN } from 'date-fns/locale'
import { Activity } from 'lucide-react'
import { toast } from 'sonner'
import {
  fetchAuditLogs,
  fetchPolicies,
  fetchRoles,
  type AuditLogEntry,
  type RbacPolicy,
  type RbacRole,
} from '@/lib/rbac-service'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ErrorState } from '@/components/ui/error-state'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader } from '@/components/layout/page-header'

const ACTION_LABEL: Record<string, string> = {
  read: '读取',
  admin: '管理',
}

export function RbacDashboard() {
  const rolesQuery = useQuery<RbacRole[]>({
    queryKey: ['rbac', 'roles'],
    queryFn: fetchRoles,
  })
  const policiesQuery = useQuery<RbacPolicy[]>({
    queryKey: ['rbac', 'policies'],
    queryFn: fetchPolicies,
  })
  const auditQuery = useQuery<{
    audits: AuditLogEntry[]
    total: number
    page: number
    limit: number
  }>({
    queryKey: ['rbac', 'audits'],
    queryFn: fetchAuditLogs,
  })

  useEffect(() => {
    if (rolesQuery.isError) {
      toast.error('角色数据加载失败')
    }
  }, [rolesQuery.isError])

  useEffect(() => {
    if (policiesQuery.isError) {
      toast.error('策略数据加载失败')
    }
  }, [policiesQuery.isError])

  useEffect(() => {
    if (auditQuery.isError) {
      toast.error('审计日志加载失败')
    }
  }, [auditQuery.isError])

  const roles = rolesQuery.data ?? []
  const policies = policiesQuery.data ?? []
  const auditLogs = auditQuery.data?.audits ?? []

  const policiesByRole = policies.reduce<Record<string, RbacPolicy[]>>(
    (acc, policy) => {
      acc[policy.subject] = acc[policy.subject] ?? []
      acc[policy.subject].push(policy)
      return acc
    },
    {}
  )

  const hasError =
    rolesQuery.isError || policiesQuery.isError || auditQuery.isError

  if (hasError) {
    return (
      <ErrorState
        title='无法加载 RBAC 概览数据'
        description='请刷新页面或稍后再试，若问题持续请联系平台团队。'
        onRetry={() => {
          void rolesQuery.refetch()
          void policiesQuery.refetch()
          void auditQuery.refetch()
        }}
      />
    )
  }

  return (
    <div className='space-y-6'>
      {/* 页面标题 */}
      <PageHeader
        title='访问控制概览'
        description='查看系统角色、权限策略和访问审计信息'
        icon={<Activity className='h-6 w-6' />}
      />

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>角色概览</CardTitle>
            <CardDescription>系统中可用的角色及权限说明</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {roles.length === 0 ? (
              <p className='text-muted-foreground text-sm'>暂无角色数据</p>
            ) : (
              roles.map((role: RbacRole) => (
                <div
                  key={role.name}
                  className='space-y-2 rounded-lg border p-4'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-semibold'>{role.name}</h3>
                    <Badge variant='outline'>
                      {role.permissions.length} 权限
                    </Badge>
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    {role.description}
                  </p>
                  {role.permissions.length > 0 && (
                    <div className='text-muted-foreground flex flex-wrap gap-2 text-xs'>
                      {role.permissions.map((permission) => (
                        <Badge key={permission} variant='secondary'>
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>角色策略</CardTitle>
            <CardDescription>查看当前角色与资源的权限配置</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {roles.length === 0 ? (
              <p className='text-muted-foreground text-sm'>暂无角色信息</p>
            ) : (
              roles.map((role) => (
                <div
                  key={role.name}
                  className='space-y-2 rounded-lg border p-3'
                >
                  <h3 className='text-sm font-medium'>{role.name}</h3>
                  <div className='space-y-1'>
                    {(policiesByRole[role.name] ?? []).length === 0 ? (
                      <p className='text-muted-foreground text-xs'>
                        尚未配置策略
                      </p>
                    ) : (
                      policiesByRole[role.name].map((policy) => (
                        <div
                          key={policy.id}
                          className='flex items-center justify-between text-sm'
                        >
                          <span className='text-muted-foreground font-mono text-xs'>
                            {policy.resource}
                          </span>
                          <Badge variant='outline'>
                            {ACTION_LABEL[policy.action] ?? policy.action}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>策略操作审计</CardTitle>
            <CardDescription>最近的角色与策略变更记录</CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <p className='text-muted-foreground text-sm'>暂无审计记录</p>
            ) : (
              <ScrollArea className='h-[320px] w-full rounded-md border p-4'>
                <div className='space-y-3'>
                  {auditLogs.map((log: AuditLogEntry) => (
                    <div
                      key={log.id}
                      className='flex items-start justify-between gap-4'
                    >
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2 text-sm font-medium'>
                          <span>{log.action}</span>
                          <Badge
                            variant={
                              log.status === 'success'
                                ? 'outline'
                                : 'destructive'
                            }
                          >
                            {log.status === 'success' ? '成功' : '失败'}
                          </Badge>
                        </div>
                        <p className='text-muted-foreground text-xs'>
                          {log.actor} → {log.target}
                        </p>
                        {log.details && (
                          <p className='text-muted-foreground text-xs'>
                            {log.details}
                          </p>
                        )}
                      </div>
                      <span className='text-muted-foreground text-xs'>
                        {formatDistanceToNow(new Date(log.timestamp), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
