import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from '@/lib/auth'
import LoginPage from '../page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock NextAuth
jest.mock('@/lib/auth', () => ({
  signIn: jest.fn(),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader">Loading...</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
  EyeOff: () => <div data-testid="eye-off-icon">EyeOff</div>,
  CheckCircle: () => <div data-testid="check-icon">Check</div>,
}))

const mockPush = jest.fn()
const mockRefresh = jest.fn()
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    } as any)
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn(),
    } as any)
  })

  it('renders login form correctly', () => {
    render(<LoginPage />)

    expect(screen.getAllByText('Đăng nhập')).toHaveLength(2) // Title and button
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu *')).toBeInTheDocument()
    expect(screen.getByLabelText(/ghi nhớ đăng nhập/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Đăng nhập' })
    ).toBeInTheDocument()
    expect(screen.getByText('Chưa có tài khoản?')).toBeInTheDocument()
    expect(screen.getByText('Đăng ký')).toBeInTheDocument()
    expect(screen.getByText('Quên mật khẩu?')).toBeInTheDocument()
  })

  it('displays success message when present in URL params', () => {
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue('Đăng ký thành công!'),
    } as any)

    render(<LoginPage />)

    expect(screen.getByText('Thành công')).toBeInTheDocument()
    expect(screen.getByText('Đăng ký thành công!')).toBeInTheDocument()
  })

  it('validates email field', async () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument()
    })
  })

  it('validates password field', async () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập mật khẩu')).toBeInTheDocument()
    })
  })

  it('toggles password visibility', () => {
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText('Mật khẩu *')
    const toggleButton = screen.getByRole('button', {
      name: /hiện mật khẩu/i,
    })

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Click to show password
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText(/ẩn mật khẩu/i)).toBeInTheDocument()

    // Click to hide password
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText(/hiện mật khẩu/i)).toBeInTheDocument()
  })

  it('handles successful login', async () => {
    mockSignIn.mockResolvedValue({
      ok: true,
      error: null,
      url: '/',
    })

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText('Mật khẩu *')
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
        callbackUrl: '/',
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('handles login with callback URL', async () => {
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation(key => {
        if (key === 'callbackUrl') return '/dashboard'
        return null
      }),
    } as any)

    mockSignIn.mockResolvedValue({
      ok: true,
      error: null,
      url: '/dashboard',
    })

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText('Mật khẩu *')
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles invalid credentials error', async () => {
    mockSignIn.mockResolvedValue({
      ok: false,
      error: 'CredentialsSignin',
      url: null,
    })

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText('Mật khẩu *')
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText('Email hoặc mật khẩu không chính xác.')
      ).toBeInTheDocument()
    })
  })

  it('handles rate limiting error', async () => {
    mockSignIn.mockResolvedValue({
      ok: false,
      error: 'Too many login attempts. Please try again later.',
      url: null,
    })

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText('Mật khẩu *')
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText('Quá nhiều lần thử. Vui lòng thử lại sau.')
      ).toBeInTheDocument()
    })
  })

  it('handles network error', async () => {
    mockSignIn.mockRejectedValue(new Error('Network error'))

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText('Mật khẩu *')
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText('Không thể kết nối đến máy chủ. Vui lòng thử lại.')
      ).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    mockSignIn.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText('Mật khẩu *')
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Should show loading state
    expect(screen.getByText('Đang xử lý...')).toBeInTheDocument()
    expect(screen.getByTestId('loader')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeDisabled()

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Đang xử lý...')).not.toBeInTheDocument()
    })
  })

  it('disables form fields during loading', async () => {
    mockSignIn.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText('Mật khẩu *')
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Fields should be disabled during loading
    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it('handles remember me checkbox', () => {
    render(<LoginPage />)

    const rememberCheckbox = screen.getByLabelText(/ghi nhớ đăng nhập/i)

    // Initially unchecked
    expect(rememberCheckbox).not.toBeChecked()

    // Check the checkbox
    fireEvent.click(rememberCheckbox)
    expect(rememberCheckbox).toBeChecked()

    // Uncheck the checkbox
    fireEvent.click(rememberCheckbox)
    expect(rememberCheckbox).not.toBeChecked()
  })

  it('has proper accessibility attributes', () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText('Mật khẩu *')
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' })

    expect(emailInput).toHaveAttribute('aria-required', 'true')
    expect(passwordInput).toHaveAttribute('aria-required', 'true')
    expect(emailInput).toHaveAttribute('autoComplete', 'email')
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')
  })

  it('navigates to register page when register link is clicked', () => {
    render(<LoginPage />)

    const registerLink = screen.getByText('Đăng ký')
    expect(registerLink.closest('a')).toHaveAttribute('href', '/auth/register')
  })

  it('has forgot password link with placeholder href', () => {
    render(<LoginPage />)

    const forgotPasswordLink = screen.getByText('Quên mật khẩu?')
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '#')
  })
})
