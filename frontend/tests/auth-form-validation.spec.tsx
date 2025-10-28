import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SignUpForm } from '@/features/auth/sign-up/components/sign-up-form'
import { toast } from 'sonner'

// Mock the auth service
vi.mock('@/lib/auth-service', () => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
}))

// Mock the router
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

// Mock the auth store
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    auth: {
      setAuth: vi.fn(),
    },
  }),
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    info: vi.fn(),
  },
}))

describe('SignUpForm Integration Tests', () => {
  let signUp: ReturnType<typeof vi.mocked<typeof import('@/lib/auth-service')['signUp']>>
  let signIn: ReturnType<typeof vi.mocked<typeof import('@/lib/auth-service')['signIn']>>

  beforeAll(async () => {
    const authModule = await import('@/lib/auth-service')
    signUp = vi.mocked(authModule.signUp)
    signIn = vi.mocked(authModule.signIn)
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all form fields correctly', () => {
    render(<SignUpForm />)

    expect(screen.getByLabelText('姓名')).toBeInTheDocument()
    expect(screen.getByLabelText('邮箱地址')).toBeInTheDocument()
    expect(screen.getByLabelText('公司')).toBeInTheDocument()
    expect(screen.getByLabelText('部门')).toBeInTheDocument()
    expect(screen.getByLabelText('密码')).toBeInTheDocument()
    expect(screen.getByLabelText('确认密码')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '创建账户' })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    const submitButton = screen.getByRole('button', { name: '创建账户' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('请输入姓名')).toBeInTheDocument()
      expect(screen.getByText('请输入邮箱地址')).toBeInTheDocument()
      expect(screen.getByText('请输入密码')).toBeInTheDocument()
      expect(screen.getByText('请确认密码')).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    const emailInput = screen.getByLabelText('邮箱地址')
    await user.type(emailInput, 'invalid-email')

    // Trigger validation by attempting to submit
    const submitButton = screen.getByRole('button', { name: '创建账户' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/邮箱/i)).toBeInTheDocument()
    })
  })

  it('validates password length', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    const passwordInput = screen.getByLabelText('密码')
    await user.type(passwordInput, '123')

    // Trigger validation by attempting to submit
    const submitButton = screen.getByRole('button', { name: '创建账户' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('密码长度至少7个字符')).toBeInTheDocument()
    })
  })

  it('validates password confirmation match', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    const passwordInput = screen.getByLabelText('密码')
    const confirmPasswordInput = screen.getByLabelText('确认密码')

    await user.type(passwordInput, 'ValidPassword1!')
    await user.type(confirmPasswordInput, 'DifferentPassword1!')

    // Trigger validation by attempting to submit
    const submitButton = screen.getByRole('button', { name: '创建账户' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument()
    })
  })

  it('validates name length', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    const nameInput = screen.getByLabelText('姓名')
    await user.type(nameInput, 'A'.repeat(61)) // Exceed 60 character limit

    // Trigger validation by attempting to submit
    const submitButton = screen.getByRole('button', { name: '创建账户' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('姓名过长')).toBeInTheDocument()
    })
  })

  it('accepts empty company and department fields', async () => {
    const user = userEvent.setup()
    const mockSignUp = vi.mocked(signUp)
    mockSignUp.mockResolvedValueOnce({
      id: '123',
      email: 'test@example.com',
      fullName: 'Test User',
      company: '',
      department: '',
      roles: ['viewer'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    })

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('姓名'), 'Test User')
    await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com')
    await user.type(screen.getByLabelText('密码'), 'ValidPassword1!')
    await user.type(screen.getByLabelText('确认密码'), 'ValidPassword1!')

    const submitButton = screen.getByRole('button', { name: '创建账户' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPassword1!',
        confirmPassword: 'ValidPassword1!',
        fullName: 'Test User',
        company: '',
        department: '',
      })
    })
  })

  it('submits form with all fields including company and department', async () => {
    const user = userEvent.setup()
    const mockSignUp = vi.mocked(signUp)
    mockSignUp.mockResolvedValueOnce({
      id: '123',
      email: 'test@example.com',
      fullName: 'Test User',
      company: 'Test Company',
      department: 'Test Department',
      roles: ['viewer'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    })

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('姓名'), 'Test User')
    await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com')
    await user.type(screen.getByLabelText('公司'), 'Test Company')
    await user.type(screen.getByLabelText('部门'), 'Test Department')
    await user.type(screen.getByLabelText('密码'), 'ValidPassword1!')
    await user.type(screen.getByLabelText('确认密码'), 'ValidPassword1!')

    const submitButton = screen.getByRole('button', { name: '创建账户' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPassword1!',
        confirmPassword: 'ValidPassword1!',
        fullName: 'Test User',
        company: 'Test Company',
        department: 'Test Department',
      })
    })
  })

  it('shows success toast and auto-login option after successful registration', async () => {
    const user = userEvent.setup()
    const mockSignUp = vi.mocked(signUp)
    const mockSignIn = vi.mocked(signIn)
    const mockToast = vi.mocked(toast)

    mockSignUp.mockResolvedValueOnce({
      id: '123',
      email: 'test@example.com',
      fullName: 'Test User',
      company: 'Test Company',
      department: 'Test Department',
      roles: ['viewer'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    })

    mockSignIn.mockResolvedValueOnce({
      user: {
        id: '123',
        email: 'test@example.com',
        fullName: 'Test User',
        company: 'Test Company',
        department: 'Test Department',
        roles: ['viewer'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      token: {
        accessToken: 'mock-token',
        expiresAt: '2024-01-01T01:00:00Z',
      },
    })

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('姓名'), 'Test User')
    await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com')
    await user.type(screen.getByLabelText('密码'), 'ValidPassword1!')
    await user.type(screen.getByLabelText('确认密码'), 'ValidPassword1!')

    const submitButton = screen.getByRole('button', { name: '创建账户' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('注册成功！欢迎 Test User', expect.any(Object))
    })

    // Test auto-login functionality
    const successCall = mockToast.success.mock.calls[0]
    const actionCallback = (successCall[1] as { action: { onClick: () => Promise<void> } }).action.onClick
    await actionCallback()

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPassword1!',
      })
      expect(mockToast.success).toHaveBeenCalledWith('登录成功！', { id: 'auto-login' })
    })
  })

  it('handles registration failure with error message', async () => {
    const user = userEvent.setup()
    const mockSignUp = vi.mocked(signUp)
    const mockToast = vi.mocked(toast)

    mockSignUp.mockRejectedValueOnce(new Error('Email already exists'))

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('姓名'), 'Test User')
    await user.type(screen.getByLabelText('邮箱地址'), 'existing@example.com')
    await user.type(screen.getByLabelText('密码'), 'ValidPassword1!')
    await user.type(screen.getByLabelText('确认密码'), 'ValidPassword1!')

    const submitButton = screen.getByRole('button', { name: '创建账户' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Email already exists')
    })
  })

  it('handles auto-login failure gracefully', async () => {
    const user = userEvent.setup()
    const mockSignUp = vi.mocked(signUp)
    const mockSignIn = vi.mocked(signIn)
    const mockToast = vi.mocked(toast)

    mockSignUp.mockResolvedValueOnce({
      id: '123',
      email: 'test@example.com',
      fullName: 'Test User',
      company: 'Test Company',
      department: 'Test Department',
      roles: ['viewer'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    })

    mockSignIn.mockRejectedValueOnce(new Error('Login failed'))

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('姓名'), 'Test User')
    await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com')
    await user.type(screen.getByLabelText('密码'), 'ValidPassword1!')
    await user.type(screen.getByLabelText('确认密码'), 'ValidPassword1!')

    const submitButton = screen.getByRole('button', { name: '创建账户' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('注册成功！欢迎 Test User', expect.any(Object))
    })

    // Test auto-login failure
    const successCall = mockToast.success.mock.calls[0]
    const actionCallback = (successCall[1] as { action: { onClick: () => Promise<void> } }).action.onClick
    await actionCallback()

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('自动登录失败，请手动登录', { id: 'auto-login' })
    })
  })

  it('disables submit button during submission', async () => {
    const user = userEvent.setup()
    const mockSignUp = vi.mocked(signUp)

    // Create a promise that we control
    let resolvePromise: (value: unknown) => void
    const mockPromise = new Promise<unknown>((resolve) => {
      resolvePromise = resolve
    })
    mockSignUp.mockReturnValueOnce(mockPromise)

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('姓名'), 'Test User')
    await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com')
    await user.type(screen.getByLabelText('密码'), 'ValidPassword1!')
    await user.type(screen.getByLabelText('确认密码'), 'ValidPassword1!')

    const submitButton = screen.getByRole('button', { name: '创建账户' })
    await user.click(submitButton)

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled()

    // Resolve the promise
    resolvePromise!({
      id: '123',
      email: 'test@example.com',
      fullName: 'Test User',
      company: '',
      department: '',
      roles: ['viewer'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    })

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })
})