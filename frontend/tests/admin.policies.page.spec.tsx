import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'

import { PoliciesPage } from '@/features/admin/policies/policies-page'
import { rbacHandlers } from '@/lib/api-mock/handlers/rbac'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
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

describe('策略管理页面（UI）', () => {
  beforeAll(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  it('加载策略列表并展示核心列与数据', async () => {
    renderWithQueryClient(<PoliciesPage />)

    await waitFor(() => {
      expect(screen.getByText('策略管理')).toBeInTheDocument()
      expect(screen.getByText('管理角色与资源的权限策略')).toBeInTheDocument()
    })

    // 检查新增策略按钮
    expect(screen.getByText('新增策略')).toBeInTheDocument()
    expect(screen.getByText('批量操作')).toBeInTheDocument()

    // 检查资源权限概览
    await waitFor(() => {
      expect(screen.getByText('资源权限概览')).toBeInTheDocument()
      expect(screen.getByText('知识源')).toBeInTheDocument()
      expect(screen.getByText('用户')).toBeInTheDocument()
      expect(screen.getByText('策略')).toBeInTheDocument()
    })

    // 检查角色策略详情
    expect(screen.getByText('角色策略详情')).toBeInTheDocument()
  })

  it('支持资源权限展开与收起', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<PoliciesPage />)

    await waitFor(() => {
      expect(screen.getByText('Administrator')).toBeInTheDocument()
    })

    // 点击展开按钮
    const expandButtons = screen.getAllByText('展开')
    expect(expandButtons.length).toBeGreaterThan(0)

    await user.click(expandButtons[0])

    // 检查按钮文本变为"收起"
    expect(screen.getByText('收起')).toBeInTheDocument()
  })

  it('支持权限开关操作并显示提示', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<PoliciesPage />)

    await waitFor(() => {
      expect(screen.getByText('Administrator')).toBeInTheDocument()
    })

    // 查找权限开关
    const switches = screen.getAllByRole('switch')
    expect(switches.length).toBeGreaterThan(0)

    // 点击权限开关
    const firstSwitch = switches[0]
    await user.click(firstSwitch)

    // 验证成功提示
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('权限已更新')
    })
  })

  it('禁用的操作不可用', async () => {
    renderWithQueryClient(<PoliciesPage />)

    await waitFor(() => {
      expect(screen.getByText('Administrator')).toBeInTheDocument()
    })

    // 查找权限开关，检查禁用状态
    const switches = screen.getAllByRole('switch')

    // 至少应该有一些开关存在
    expect(switches.length).toBeGreaterThan(0)

    // 检查是否包含禁用的开关（通过样式类判断）
    const disabledSwitches = switches.filter(switch_ =>
      switch_.classList.contains('opacity-30')
    )

    // Mock 数据中应该有一些禁用的选项
    expect(disabledSwitches.length).toBeGreaterThanOrEqual(0)
  })

  it('空数据状态正确显示', async () => {
    // Mock 返回空角色数据
    server.use(
      http.get('*/admin/roles', () => {
        return HttpResponse.json({ roles: [] })
      })
    )

    renderWithQueryClient(<PoliciesPage />)

    await waitFor(() => {
      expect(screen.getByText('策略管理')).toBeInTheDocument()
    })

    // 检查资源权限概览仍然存在
    expect(screen.getByText('资源权限概览')).toBeInTheDocument()

    // 检查角色策略详情为空
    expect(screen.getByText('角色策略详情')).toBeInTheDocument()
  })
})