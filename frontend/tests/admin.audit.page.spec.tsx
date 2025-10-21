import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'

import { AuditPage } from '@/features/admin/audit/audit-page-simple'
import { rbacHandlers } from '@/lib/api-mock/handlers/rbac'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

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

    // 检查表格列头
    expect(screen.getByText('时间')).toBeInTheDocument()
    expect(screen.getByText('操作人')).toBeInTheDocument()
    expect(screen.getByText('动作')).toBeInTheDocument()
    expect(screen.getByText('目标')).toBeInTheDocument()
    expect(screen.getByText('状态')).toBeInTheDocument()
    expect(screen.getByText('详情')).toBeInTheDocument()

    // 检查数据行
    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument()
      expect(screen.getByText('分配角色')).toBeInTheDocument()
      expect(screen.getByText('成功')).toBeInTheDocument()
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

  it('支持状态筛选功能', async () => {
    const _user = userEvent.setup()

    // Mock the navigate function
    mockNavigate.mockImplementation(({ search }) => {
      if (typeof search === 'function') {
        const newState = search(mockSearchState)
        Object.assign(mockSearchState, newState)
        return Promise.resolve()
      }
    })

    renderWithQueryClient(<AuditPage />)

    // 点击状态筛选按钮
    const statusFilterButton = screen.getByText('状态筛选')
    await _user.click(statusFilterButton)

    // 检查下拉菜单内容
    await waitFor(() => {
      expect(screen.getByText('成功')).toBeInTheDocument()
      expect(screen.getByText('失败')).toBeInTheDocument()
    })

    // 选择状态选项
    const successOption = screen.getByText('成功')
    await _user.click(successOption)

    // 验证导航被调用
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled()
    })
  })

  it('支持动作筛选功能', async () => {
    const _user = userEvent.setup()

    // Mock the navigate function
    mockNavigate.mockImplementation(({ search }) => {
      if (typeof search === 'function') {
        const newState = search(mockSearchState)
        Object.assign(mockSearchState, newState)
        return Promise.resolve()
      }
    })

    renderWithQueryClient(<AuditPage />)

    // 点击动作筛选按钮
    const actionFilterButton = screen.getByText('动作筛选')
    await _user.click(actionFilterButton)

    // 检查下拉菜单内容
    await waitFor(() => {
      expect(screen.getByText('分配角色')).toBeInTheDocument()
      expect(screen.getByText('更新策略')).toBeInTheDocument()
    })
  })

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

  it('支持日期筛选功能', async () => {
    const _user = userEvent.setup()

    // Mock the navigate function
    mockNavigate.mockImplementation(({ search }) => {
      if (typeof search === 'function') {
        const newState = search(mockSearchState)
        Object.assign(mockSearchState, newState)
        return Promise.resolve()
      }
    })

    renderWithQueryClient(<AuditPage />)

    // 查找日期输入框
    const startDateInputs = screen.getAllByPlaceholderText('开始日期')

    if (startDateInputs.length > 0) {
      await _user.type(startDateInputs[0], '2025-01-01')

      // 验证导航被调用
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled()
      })
    }
  })

  it('空数据状态正确显示', async () => {
    // Mock 返回空审计数据
    server.use(
      http.get('*/admin/audit', () => {
        return HttpResponse.json({ audits: [] })
      })
    )

    renderWithQueryClient(<AuditPage />)

    await waitFor(() => {
      expect(screen.getByText('暂无审计记录')).toBeInTheDocument()
    })

    // 检查空状态提示文案
    expect(screen.getByText('还没有审计记录。')).toBeInTheDocument()
  })

  it('搜索结果为空时显示正确提示', async () => {
    const _user = userEvent.setup()

    // 设置初始搜索状态为不存在的记录
    mockSearchState.search = 'nonexistent'

    renderWithQueryClient(<AuditPage />)

    // 检查空状态消息
    await waitFor(() => {
      expect(screen.getByText('没有找到符合条件的审计记录，请尝试调整搜索条件或筛选器。')).toBeInTheDocument()
    })
  })

  it('分页功能正常工作', async () => {
    const _user = userEvent.setup()

    // Mock the navigate function
    mockNavigate.mockImplementation(({ search }) => {
      if (typeof search === 'function') {
        const newState = search(mockSearchState)
        Object.assign(mockSearchState, newState)
        return Promise.resolve()
      }
    })

    renderWithQueryClient(<AuditPage />)

    await waitFor(() => {
      expect(screen.getByText('共 2 条记录 · 第 1 页')).toBeInTheDocument()
    })

    // 查找分页按钮
    const prevButtons = screen.getAllByText('上一页')
    const nextButtons = screen.getAllByText('下一页')

    if (nextButtons.length > 0) {
      // 点击下一页应该被禁用（因为只有2条记录）
      expect(nextButtons[0]).toBeDisabled()
    }

    // 上一页应该被禁用（因为当前是第1页）
    if (prevButtons.length > 0) {
      expect(prevButtons[0]).toBeDisabled()
    }
  })
})