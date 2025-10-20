import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderRoute } from './utils/render-with-providers'
import { resetKnowledgeSourceFixtures } from '@/lib/api-mock/fixtures/knowledge-sources'
import { authFixtures } from '@/lib/api-mock/fixtures/auth'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

function authenticate() {
  const authState = useAuthStore.getState().auth
  authState.setAuth(authFixtures.createAuthResponse(authFixtures.user))
}

describe('知识源管理页面（UI）', () => {
  let successSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    resetKnowledgeSourceFixtures()
    authenticate()
    successSpy = vi.spyOn(toast, 'success').mockImplementation(() => undefined)
    errorSpy = vi.spyOn(toast, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    successSpy.mockRestore()
    errorSpy.mockRestore()
    useAuthStore.getState().auth.reset()
  })

  it('加载列表并展示核心列与数据', async () => {
    renderRoute('/admin/sources')

    await screen.findByText('Core API Service')

    expect(
      screen.getByRole('columnheader', {
        name: '名称',
      })
    ).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '仓库地址' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '状态' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '最近同步' })).toBeInTheDocument()
  })

  it('支持搜索与状态筛选过滤', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/sources')

    const searchInput = await screen.findByPlaceholderText('搜索知识源名称或仓库地址')
    await user.type(searchInput, 'Frontend')

    await screen.findByText('Frontend Console')
    await waitFor(() => {
      expect(screen.queryByText('Core API Service')).not.toBeInTheDocument()
    })

    await user.clear(searchInput)

    const filterButton = screen.getByRole('button', { name: /状态筛选/ })
    await user.click(filterButton)

    const disabledOption = await screen.findByRole('menuitemcheckbox', {
      name: '已禁用',
    })
    await user.click(disabledOption)

    await waitFor(() => {
      const disabledBadges = screen.getAllByText('已禁用')
      expect(disabledBadges.length).toBeGreaterThan(0)
    })

    expect(screen.queryByText('Core API Service')).not.toBeInTheDocument()
  })

  it('新增知识源时触发表单校验并成功创建', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/sources')

    const createButton = await screen.findByRole('button', { name: '新增知识源' })
    await user.click(createButton)

    const dialog = await screen.findByRole('dialog')
    const submitButton = within(dialog).getByRole('button', { name: '提交' })
    await user.click(submitButton)

    await screen.findByText('请输入知识源名称')

    await user.type(within(dialog).getByLabelText('知识源名称'), 'Mock Source')
    await user.type(
      within(dialog).getByLabelText('仓库地址'),
      'https://github.com/enterprise/mock.git'
    )
    await user.type(within(dialog).getByLabelText('默认分支'), 'main')
    await user.click(within(dialog).getByRole('combobox', { name: '凭据模式' }))
    const sshOption = await screen.findByRole('option', { name: 'SSH' })
    await user.click(sshOption)
    await user.type(
      within(dialog).getByLabelText('解析语言（以逗号分隔）'),
      '{selectall}python, typescript'
    )

    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    await screen.findByText('Mock Source')
    expect(successSpy).toHaveBeenCalledWith('知识源已创建')
  })

  it('支持禁用/启用与触发同步操作并展示提示', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/sources')

    const row = (await screen.findByText('Core API Service')).closest('tr') as HTMLTableRowElement
    expect(row).toBeTruthy()

    const actionButton = within(row).getByRole('button')
    await user.click(actionButton)

    const disableMenuItem = await screen.findByRole('menuitem', { name: '禁用' })
    await user.click(disableMenuItem)

    const confirmDialog = await screen.findByRole('alertdialog')
    await user.click(within(confirmDialog).getByRole('button', { name: '确认' }))

    await waitFor(() => {
      expect(successSpy).toHaveBeenCalledWith('已禁用知识源')
    })

    await waitFor(() => {
      expect(within(row).getByText('已禁用')).toBeInTheDocument()
    })

    await user.click(within(row).getByRole('button'))
    const enableMenuItem = await screen.findByRole('menuitem', { name: '启用' })
    await user.click(enableMenuItem)
    const reenableDialog = await screen.findByRole('alertdialog')
    await user.click(within(reenableDialog).getByRole('button', { name: '确认' }))

    await waitFor(() => {
      expect(successSpy).toHaveBeenCalledWith('已启用知识源')
    })

    await waitFor(() => {
      expect(within(row).getByText('已启用')).toBeInTheDocument()
    })

    await user.click(within(row).getByRole('button'))
    const syncMenuItem = await screen.findByRole('menuitem', { name: '触发同步' })
    await user.click(syncMenuItem)

    await waitFor(() => {
      expect(successSpy).toHaveBeenCalledWith('已触发增量同步任务')
    })

    await waitFor(() => {
      expect(within(row).getByText('同步中')).toBeInTheDocument()
    })
  })

  it('支持批量操作流程并刷新状态', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/sources')

    const firstCheckbox = await screen.findByLabelText('选择 Core API Service')
    const secondCheckbox = await screen.findByLabelText('选择 Frontend Console')

    await user.click(firstCheckbox)
    await user.click(secondCheckbox)

    await screen.findByText('已选择 2 项')

    await user.click(screen.getByRole('button', { name: '批量禁用' }))
    const disableDialog = await screen.findByRole('alertdialog')
    await user.click(within(disableDialog).getByRole('button', { name: '确认' }))

    await waitFor(() => {
      expect(successSpy).toHaveBeenCalledWith(expect.stringContaining('禁用'))
    })

    await waitFor(() => {
      expect(screen.getAllByText('已禁用').length).toBeGreaterThanOrEqual(2)
    })

    expect(screen.queryByText(/已选择/)).not.toBeInTheDocument()

    const firstCheckboxAfter = await screen.findByLabelText('选择 Core API Service')
    const secondCheckboxAfter = await screen.findByLabelText('选择 Frontend Console')

    await user.click(firstCheckboxAfter)
    await user.click(secondCheckboxAfter)

    await screen.findByText('已选择 2 项')

    await user.click(screen.getByRole('button', { name: '批量同步' }))
    const syncDialog = await screen.findByRole('alertdialog')
    await user.click(within(syncDialog).getByRole('button', { name: '确认' }))

    await waitFor(() => {
      expect(successSpy).toHaveBeenCalledWith(expect.stringContaining('同步'))
    })

    await waitFor(() => {
      expect(screen.getAllByText('同步中').length).toBeGreaterThanOrEqual(2)
    })

    expect(screen.queryByText(/已选择/)).not.toBeInTheDocument()
  })
})
