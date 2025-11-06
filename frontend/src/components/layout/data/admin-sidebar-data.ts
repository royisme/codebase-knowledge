import {
  Users,
  ShieldCheck,
  Database,
  Settings,
  HelpCircle,
  Activity,
  Home,
  ListTodo,
  Search,
  Eye,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const adminSidebarData: SidebarData = {
  teams: [
    {
      name: '系统管理控制台',
      logo: ShieldCheck,
      plan: '配置与任务管理',
    },
  ],
  navGroups: [
    {
      title: '运维监控',
      items: [
        {
          title: '任务中心',
          url: '/admin/tasks',
          icon: ListTodo,
        },
        {
          title: '数据分析',
          url: '/admin/analytics',
          icon: Eye,
        },
        {
          title: 'RAG 调试台',
          url: '/admin/rag-console',
          icon: Search,
        },
      ],
    },
    {
      title: '系统配置',
      items: [
        {
          title: '知识源管理',
          url: '/admin/sources',
          icon: Database,
        },
      ],
    },
    {
      title: '访问控制',
      items: [
        {
          title: '访问控制概览',
          url: '/admin/rbac',
          icon: Activity,
        },
        {
          title: '用户管理',
          url: '/admin/users',
          icon: Users,
        },
        {
          title: '权限策略',
          url: '/admin/policies',
          icon: ShieldCheck,
        },
      ],
    },
    {
      title: '审计与监控',
      items: [
        {
          title: '审计日志',
          url: '/admin/audit',
          icon: Activity,
        },
      ],
    },
    {
      title: '快捷入口',
      items: [
        {
          title: '返回工作台',
          url: '/',
          icon: Home,
        },
        {
          title: '设置',
          url: '/settings',
          icon: Settings,
        },
        {
          title: '帮助中心',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
