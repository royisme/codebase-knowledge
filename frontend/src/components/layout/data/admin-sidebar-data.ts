import {
  Users,
  ShieldCheck,
  Database,
  Settings,
  HelpCircle,
  Activity,
  Home,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const adminSidebarData: SidebarData = {
  user: {
    name: '系统管理员',
    email: 'admin@example.com',
    avatar: '/avatars/admin.jpg',
  },
  teams: [
    {
      name: '系统管理控制台',
      logo: ShieldCheck,
      plan: '配置与任务管理',
    },
  ],
  navGroups: [
    {
      title: '管理功能',
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
