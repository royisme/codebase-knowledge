import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'

import { AuditPage } from '@/features/admin/audit/audit-page-simple'
import { rbacHandlers } from '@/lib/api-mock/handlers/rbac'
import { setupServer } from 'msw/node'

// Mock TanStack Router
const mockSearchState = { page: 1, pageSize: 20, search: '', statuses: [], actions: [], startDate: '', endDate: '' }
const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  getRouteApi: () => ({
    useSearch: () => mockSearchState,
    useNavigate: () => mockNavigate,
  }),
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

const server = setupServer(...rbacHandlers)

describe('审计日志页面（UI）', () => {
  beforeAll(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
    Object.assign(mockSearchState, { page: 1, pageSize: 20, search: '', statuses: [], actions: [], startDate: '', endDate: '' })
    mockNavigate.mockClear()
  })

  afterAll(() => {
    server.close()
  })

  it('加载审计日志列表并展示核心列与数据', async () => {
    renderWithQueryClient(<AuditPage />)

    await waitFor(() => {
      expect(screen.getByText('审计日志')).toBeInTheDocument()
      expect(screen.getByText('查看系统操作审计记录')).toBeInTheDocument()
    })

    // 检查操作按钮
    expect(screen.getByText('导出日志')).toBeInTheDocument()
    expect(screen.getByText('刷新')).toBeInTheDocument()

    // 等待表格加载完成，然后检查表格列头
    await waitFor(() => {
      expect(screen.getByText('时间')).toBeInTheDocument()
      expect(screen.getByText('操作人')).toBeInTheDocument()
      expect(screen.getByText('动作')).toBeInTheDocument()
      expect(screen.getByText('目标')).toBeInTheDocument()
      expect(screen.getByText('状态')).toBeInTheDocument()
      expect(screen.getByText('详情')).toBeInTheDocument()
    })

    // 检查数据行 - 使用更具体的选择器
    await waitFor(() => {
      expect(screen.getAllByText('admin@example.com')).toHaveLength(3)
      expect(screen.getByText('分配角色')).toBeInTheDocument()
      expect(screen.getAllByText('成功')).toHaveLength(4)
    })
  })

  it('支持搜索功能并更新路由参数', async () => {
    const user = userEvent.setup()

    // Mock the navigate function to handle state updates
    mockNavigate.mockImplementation(({ search }) => {
      if (typeof search === 'function') {
        const newState = search(mockSearchState)
        Object.assign(mockSearchState, newState)
        return Promise.resolve()
      }
    })

    renderWithQueryClient(<AuditPage />)

    // 等待页面加载
    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索操作人、动作或目标')).toBeInTheDocument()
    })

    // 测试搜索输入
    const searchInput = screen.getByPlaceholderText('搜索操作人、动作或目标')
    await user.clear(searchInput)
    await user.type(searchInput, 'test')

    // 验证导航被调用
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled()
    })
  })

// 状态、动作筛选将在真实后端接入后补充测试

  it('支持导出功能并显示提示', async () => {
    const _user = userEvent.setup()
    renderWithQueryClient(<AuditPage />)

    // 点击导出按钮
    const exportButton = screen.getByText('导出日志')
    await _user.click(exportButton)

    // 验证提示信息
    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith('导出功能开发中...')
    })
  })

  // 其余空态、分页等测试将在真实后端数据接入后补充
})
