import type { ReactNode } from 'react'
import {
  Activity,
  Database,
  Eye,
  GitBranch,
  ListTodo,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'

export interface RouteMetadata {
  title: string
  description: string
  icon: ReactNode
  breadcrumbLabel?: string
}

/**
 * Admin 路由元数据配置
 *
 * 键名为路由路径，值为页面元数据
 */
export const adminRoutesMetadata: Record<string, RouteMetadata> = {
  // 运维监控
  '/admin/tasks': {
    title: '任务中心',
    description: '查看和管理系统任务、索引任务和后台作业',
    icon: <ListTodo className='h-6 w-6' />,
    breadcrumbLabel: '任务中心',
  },
  '/admin/analytics': {
    title: '数据分析',
    description: '知识库使用分析和智能洞察',
    icon: <Eye className='h-6 w-6' />,
    breadcrumbLabel: '数据分析',
  },
  '/admin/rag-console': {
    title: 'RAG 调试台',
    description: '调试和测试 RAG 检索增强生成功能',
    icon: <Search className='h-6 w-6' />,
    breadcrumbLabel: 'RAG 调试台',
  },

  // 系统配置
  '/admin/repositories': {
    title: '代码仓库管理',
    description: '管理代码仓库并触发索引任务',
    icon: <GitBranch className='h-6 w-6' />,
    breadcrumbLabel: '代码仓库',
  },
  '/admin/sources': {
    title: '知识源管理',
    description: '管理知识源并触发同步任务',
    icon: <Database className='h-6 w-6' />,
    breadcrumbLabel: '知识源',
  },

  // 访问控制
  '/admin/rbac': {
    title: '访问控制概览',
    description: '查看系统角色、权限策略和访问审计信息',
    icon: <Activity className='h-6 w-6' />,
    breadcrumbLabel: '访问控制概览',
  },
  '/admin/users': {
    title: '用户管理',
    description: '管理系统用户、分配角色和查看用户活动',
    icon: <Users className='h-6 w-6' />,
    breadcrumbLabel: '用户管理',
  },
  '/admin/policies': {
    title: '权限策略',
    description: '管理角色与资源的访问权限配置',
    icon: <ShieldCheck className='h-6 w-6' />,
    breadcrumbLabel: '权限策略',
  },

  // 审计与监控
  '/admin/audit': {
    title: '审计日志',
    description: '查看系统操作审计记录',
    icon: <Activity className='h-6 w-6' />,
    breadcrumbLabel: '审计日志',
  },
}

/**
 * 根据路由路径获取页面元数据
 */
export function getRouteMetadata(path: string): RouteMetadata | null {
  return adminRoutesMetadata[path] || null
}

/**
 * 生成面包屑导航数据
 */
export function generateBreadcrumbs(path: string) {
  const breadcrumbs = [{ label: '系统管理', href: '/admin' }]

  const metadata = getRouteMetadata(path)
  if (metadata) {
    breadcrumbs.push({
      label: metadata.breadcrumbLabel || metadata.title,
      href: path,
    })
  }

  return breadcrumbs
}
