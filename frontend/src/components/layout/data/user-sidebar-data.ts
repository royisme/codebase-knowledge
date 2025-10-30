import {
  ListTodo,
  Settings,
  HelpCircle,
  Search,
  Eye,
  Brain,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const userSidebarData: SidebarData = {
  user: {
    name: '普通用户',
    email: 'user@example.com',
    avatar: '/avatars/user.jpg',
  },
  teams: [
    {
      name: '代码知识问答',
      logo: Brain,
      plan: '用户工作台',
    },
  ],
  navGroups: [
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
          title: 'GraphRAG 查询',
          url: '/knowledge-graph-query',
          icon: Brain,
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
