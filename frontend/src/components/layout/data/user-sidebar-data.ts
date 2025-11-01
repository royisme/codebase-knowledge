import {
  Settings,
  HelpCircle,
  Brain,
  LayoutDashboard,
  Compass,
  BookMarked,
  MessageSquare,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const userSidebarData: SidebarData = {
  teams: [
    {
      name: '代码知识问答',
      logo: Brain,
      plan: '用户工作台',
    },
  ],
  navGroups: [
    {
      title: '知识探索',
      items: [
        {
          title: '工作台概览',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: '知识源导航',
          url: '/knowledge-explore',
          icon: Compass,
        },
        {
          title: '智能问答',
          url: '/knowledge-graph-query',
          icon: MessageSquare,
        },
        {
          title: '知识摘录',
          url: '/knowledge-library',
          icon: BookMarked,
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
