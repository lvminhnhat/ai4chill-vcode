import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import RegisterPage from '../page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any)

    // Mock successful fetch response by default
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: 'User registered successfully',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER',
        },
      }),
    })
  })

  it('renders all form fields correctly', () => {
    render(<RegisterPage />)

    expect(screen.getByLabelText(/Họ và tên/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Mật khẩu/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Xác nhận mật khẩu/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Đăng ký/i })).toBeInTheDocument()
  })

  it('shows required field indicators', () => {
    render(<RegisterPage />)

    expect(screen.getByText('Email *')).toBeInTheDocument()
    expect(screen.getByText('Mật khẩu *')).toBeInTheDocument()
    expect(screen.getByText('Xác nhận mật khẩu *')).toBeInTheDocument()
  })

  it('shows login link', () => {
    render(<RegisterPage />)

    const loginLink = screen.getByRole('link', { name: /Đăng nhập/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/auth/signin')
  })

  it('shows validation errors for empty required fields', async () => {
    render(<RegisterPage />)

    const submitButton = screen.getByRole('button', { name: /Đăng ký/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Email không hợp lệ/i)).toBeInTheDocument()
      expect(
        screen.getByText(/Mật khẩu phải có ít nhất 8 ký tự/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Vui lòng xác nhận mật khẩu/i)
      ).toBeInTheDocument()
    })
  })

  it('shows error for invalid email format', async () => {
    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/Email/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.blur(emailInput)

    await waitFor(() => {
      expect(screen.getByText(/Email không hợp lệ/i)).toBeInTheDocument()
    })
  })

  it('shows error for short password', async () => {
    render(<RegisterPage />)

    const passwordInput = screen.getByLabelText(/^Mật khẩu/i)
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.blur(passwordInput)

    await waitFor(() => {
      expect(screen.getByText(/Mật khẩu phải có ít nhất 8 ký tự/i)).toBeInTheDocument()
    })
  })
  })

  it('shows error when passwords do not match', async () => {
    render(<RegisterPage />)

    const passwordInput = screen.getByLabelText(/^Mật khẩu/i)
    const confirmPasswordInput = screen.getByLabelText(/Xác nhận mật khẩu/i)

    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'different123' },
    })
    fireEvent.blur(confirmPasswordInput)

    await waitFor(() => {
      expect(
        screen.getByText(/Mật khẩu xác nhận không khớp/i)
      ).toBeInTheDocument()
    })
  })

  it('shows password match indicator when passwords match', async () => {
    render(<RegisterPage />)

    const passwordInput = screen.getByLabelText(/^Mật khẩu/i)
    const confirmPasswordInput = screen.getByLabelText(/Xác nhận mật khẩu/i)

    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

    await waitFor(() => {
      expect(screen.getByText(/Mật khẩu khớp/i)).toBeInTheDocument()
    })
  })

  it('shows password strength indicator when password is entered', async () => {
    render(<RegisterPage />)

    const passwordInput = screen.getByLabelText(/^Mật khẩu/i)
    fireEvent.change(passwordInput, { target: { value: 'weak' } })

    await waitFor(() => {
      expect(screen.getByText(/Độ mạnh mật khẩu:/i)).toBeInTheDocument()
      expect(screen.getByText(/Yếu/i)).toBeInTheDocument()
    })
  })

  it('shows strong password indicator for complex password', async () => {
    render(<RegisterPage />)

    const passwordInput = screen.getByLabelText(/^Mật khẩu/i)
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ssw0rd!' } })

    await waitFor(() => {
      const strengthText = screen.getByText('Mạnh')
      expect(strengthText).toBeInTheDocument()
      expect(strengthText).toHaveClass('text-green-600')
    })
  })

  it('submits form with valid data', async () => {
    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/Email/i)
    const passwordInput = screen.getByLabelText(/^Mật khẩu/i)
    const confirmPasswordInput = screen.getByLabelText(/Xác nhận mật khẩu/i)
    const nameInput = screen.getByLabelText(/Họ và tên/i)
    const submitButton = screen.getByRole('button', { name: /Đăng ký/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.change(nameInput, { target: { value: 'Test User' } })

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        }),
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/auth/signin?message=Đăng ký thành công! Vui lòng đăng nhập.'
      )
    })
  })

  it('submits form without optional name field', async () => {
    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/Email/i)
    const passwordInput = screen.getByLabelText(/^Mật khẩu/i)
    const confirmPasswordInput = screen.getByLabelText(/Xác nhận mật khẩu/i)
    const submitButton = screen.getByRole('button', { name: /Đăng ký/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          name: undefined,
        }),
      })
    })
  })

  it('shows duplicate email error', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        error: {
          code: 'DUPLICATE_EMAIL',
          message: 'User with this email already exists',
        },
      }),
    })

    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/Email/i)
    const passwordInput = screen.getByLabelText(/^Mật khẩu/i)
    const confirmPasswordInput = screen.getByLabelText(/Xác nhận mật khẩu/i)
    const submitButton = screen.getByRole('button', { name: /Đăng ký/i })

    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Email này đã được sử dụng/i)).toBeInTheDocument()
    })
  })

  it('shows validation error from server', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 8 characters long',
        },
      }),
    })

    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/Email/i)
    const passwordInput = screen.getByLabelText(/^Mật khẩu/i)
    const confirmPasswordInput = screen.getByLabelText(/Xác nhận mật khẩu/i)
    const submitButton = screen.getByRole('button', { name: /Đăng ký/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/Password must be at least 8 characters long/i)
      ).toBeInTheDocument()
    })
  })

  it('shows rate limit error', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests. Please try again later.',
        },
      }),
    })

    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/Email/i)
    const passwordInput = screen.getByLabelText(/^Mật khẩu/i)
    const confirmPasswordInput = screen.getByLabelText(/Xác nhận mật khẩu/i)
    const submitButton = screen.getByRole('button', { name: /Đăng ký/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Quá nhiều yêu cầu/i)).toBeInTheDocument()
    })
  })

  it('shows generic error for network issues', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/Email/i)
    const passwordInput = screen.getByLabelText(/^Mật khẩu/i)
    const confirmPasswordInput = screen.getByLabelText(/Xác nhận mật khẩu/i)
    const submitButton = screen.getByRole('button', { name: /Đăng ký/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/Không thể kết nối đến máy chủ/i)
      ).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    // Mock delayed response
    ;(fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  success: true,
                  message: 'User registered successfully',
                }),
              }),
            100
          )
        )
    )

    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/Email/i)
    const passwordInput = screen.getByLabelText(/^Mật khẩu/i)
    const confirmPasswordInput = screen.getByLabelText(/Xác nhận mật khẩu/i)
    const submitButton = screen.getByRole('button', { name: /Đăng ký/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

    fireEvent.click(submitButton)

    // Check loading state
    expect(screen.getByText(/Đang xử lý/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Đang xử lý/i })).toBeDisabled()

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText(/Đang xử lý/i)).not.toBeInTheDocument()
    })
  })

  it('disables form fields during loading', async () => {
    // Mock delayed response
    ;(fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  success: true,
                  message: 'User registered successfully',
                }),
              }),
            100
          )
        )
    )

    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/Email/i)
    const passwordInput = screen.getByLabelText(/^Mật khẩu/i)
    const confirmPasswordInput = screen.getByLabelText(/Xác nhận mật khẩu/i)
    const submitButton = screen.getByRole('button', { name: /Đăng ký/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

    fireEvent.click(submitButton)

    // Check that inputs are disabled during loading
    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(confirmPasswordInput).toBeDisabled()
  })

  it('toggles password visibility', () => {
    render(<RegisterPage />)

    const passwordInput = screen.getByLabelText(
      /^Mật khẩu/i
    ) as HTMLInputElement
    const toggleButton = screen.getByLabelText('Hiện mật khẩu')

    // Initially password should be hidden
    expect(passwordInput.type).toBe('password')

    // Click to show password
    fireEvent.click(toggleButton)
    expect(passwordInput.type).toBe('text')
    expect(screen.getByLabelText('Ẩn mật khẩu')).toBeInTheDocument()

    // Click to hide password
    fireEvent.click(toggleButton)
    expect(passwordInput.type).toBe('password')
    expect(screen.getByLabelText('Hiện mật khẩu')).toBeInTheDocument()
  })

  it('toggles confirm password visibility', () => {
    render(<RegisterPage />)

    const confirmPasswordInput = screen.getByLabelText(
      /Xác nhận mật khẩu/i
    ) as HTMLInputElement
    const toggleButton = screen.getByLabelText('Hiện mật khẩu xác nhận')

    // Initially password should be hidden
    expect(confirmPasswordInput.type).toBe('password')

    // Click to show password
    fireEvent.click(toggleButton)
    expect(confirmPasswordInput.type).toBe('text')
    expect(screen.getByLabelText('Ẩn mật khẩu xác nhận')).toBeInTheDocument()

    // Click to hide password
    fireEvent.click(toggleButton)
    expect(confirmPasswordInput.type).toBe('password')
    expect(screen.getByLabelText('Hiện mật khẩu xác nhận')).toBeInTheDocument()
  })

  it('has proper ARIA labels and roles', () => {
    render(<RegisterPage />)

    expect(
      screen.getByRole('heading', { name: 'Đăng ký tài khoản' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-required',
      'true'
    )
    expect(screen.getByLabelText(/^Mật khẩu/i)).toHaveAttribute(
      'aria-required',
      'true'
    )
    expect(screen.getByLabelText('Xác nhận mật khẩu')).toHaveAttribute(
      'aria-required',
      'true'
    )
  })

  it('supports keyboard navigation', () => {
    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/Email/i)

    // Focus should work
    emailInput.focus()
    expect(emailInput).toHaveFocus()
  })
})
