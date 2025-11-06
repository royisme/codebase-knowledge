import type { ReactNode } from 'react'
import {
  Brain,
  LayoutDashboard,
  Compass,
  BookMarked,
  MessageSquare,
  Settings,
  HelpCircle,
} from 'lucide-react'

export interface RouteMetadata {
  title: string
  description: string
  icon: ReactNode
  breadcrumbLabel?: string
}

/**
 * 普通用户路由元数据配置
 *
 * 键名为路由路径，值为页面元数据
 */
export const userRoutesMetadata: Record<string, RouteMetadata> = {
  // 知识探索
  '/': {
    title: '工作台概览',
    description: '查看知识库概览、最近查询和常用功能',
    icon: <LayoutDashboard className='h-6 w-6' />,
    breadcrumbLabel: '工作台',
  },
  '/knowledge-explore': {
    title: '知识源导航',
    description: '浏览和探索可用的代码知识源',
    icon: <Compass className='h-6 w-6' />,
    breadcrumbLabel: '知识源导航',
  },
  '/knowledge-graph-query': {
    title: '智能问答',
    description: '基于知识图谱的智能代码问答系统',
    icon: <MessageSquare className='h-6 w-6' />,
    breadcrumbLabel: '智能问答',
  },
  '/knowledge-library': {
    title: '知识摘录',
    description: '管理和查看您的代码知识摘录',
    icon: <BookMarked className='h-6 w-6' />,
    breadcrumbLabel: '知识摘录',
  },
  '/rag-console': {
    title: 'RAG 调试台',
    description: '测试和调试 RAG 检索增强生成功能',
    icon: <Brain className='h-6 w-6' />,
    breadcrumbLabel: 'RAG 调试台',
  },

  // 系统设置
  '/settings': {
    title: '个人设置',
    description: '管理您的账户和偏好设置',
    icon: <Settings className='h-6 w-6' />,
    breadcrumbLabel: '设置',
  },
  '/help-center': {
    title: '帮助中心',
    description: '查看使用文档和常见问题',
    icon: <HelpCircle className='h-6 w-6' />,
    breadcrumbLabel: '帮助中心',
  },
}

/**
 * 根据路由路径获取页面元数据
 */
export function getRouteMetadata(path: string): RouteMetadata | null {
  return userRoutesMetadata[path] || null
}

/**
 * 生成面包屑导航数据
 */
export function generateBreadcrumbs(path: string): Array<{
  label: string
  href?: string
}> {
  // 如果是首页，只返回首页
  if (path === '/') {
    return [{ label: '首页' }]
  }

  const breadcrumbs: Array<{ label: string; href?: string }> = [
    { label: '首页', href: '/' },
  ]

  const metadata = getRouteMetadata(path)
  if (metadata) {
    breadcrumbs.push({
      label: metadata.breadcrumbLabel || metadata.title,
      href: path,
    })
  }

  return breadcrumbs
}
