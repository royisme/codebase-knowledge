import {
  ListTodo,
  Users,
  ShieldCheck,
  Database,
  Settings,
  HelpCircle,
  Search,
  Eye,
  Activity,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: '系统管理员',
    email: 'admin@example.com',
    avatar: '/avatars/admin.jpg',
  },
  teams: [
    {
      name: '企业知识库',
      logo: ShieldCheck,
      plan: '企业版',
    },
  ],
  navGroups: [
    {
      title: '主要功能',
      items: [
        {
          title: '知识源',
          url: '/admin/sources',
          icon: Database,
        },
        {
          title: '用户管理',
          url: '/admin/rbac',
          icon: Users,
        },
        {
          title: '策略管理',
          url: '/admin/policies',
          icon: ShieldCheck,
        },
        {
          title: '审计日志',
          url: '/admin/audit',
          icon: Activity,
        },
      ],
    },
    {
      title: '工作台',
      items: [
        {
          title: '任务中心',
          url: '/tasks',
          icon: ListTodo,
          badge: '即将上线',
        },
        {
          title: 'RAG 控制台',
          url: '/rag-console',
          icon: Search,
          badge: '即将上线',
        },
        {
          title: '数据分析',
          url: '/analytics',
          icon: Eye,
          badge: '即将上线',
        },
      ],
    },
    {
      title: '系统设置',
      items: [
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
