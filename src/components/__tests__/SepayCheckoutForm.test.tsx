import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import SepayCheckoutForm from '../SepayCheckoutForm'

// Mock the sepay-sdk
jest.mock('@/lib/sepay-sdk', () => ({
  getCheckoutUrl: jest.fn(() => 'https://checkout.sepay.vn'),
  createCheckoutFields: jest.fn(() => ({
    signature: 'test-signature',
    merchant: 'test-merchant',
    order_invoice_number: 'INV-1234567890-ABC123',
    order_amount: 150000,
    currency: 'VND',
    order_description: 'Test payment',
    success_url: 'http://localhost:3000/payment/success?orderId=ORD-123',
    error_url: 'http://localhost:3000/payment/error?orderId=ORD-123',
    cancel_url: 'http://localhost:3000/payment/cancel?orderId=ORD-123',
  })),
  generateInvoiceNumber: jest.fn(() => 'INV-1234567890-ABC123'),
  PaymentMethod: {
    BANK_TRANSFER: 'BANK_TRANSFER',
    CARD: 'CARD',
    NAPAS_BANK_TRANSFER: 'NAPAS_BANK_TRANSFER',
  },
}))

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXTAUTH_URL: 'http://localhost:3000',
    NEXT_PUBLIC_SUCCESS_URL: '/payment/success',
    NEXT_PUBLIC_ERROR_URL: '/payment/error',
    NEXT_PUBLIC_CANCEL_URL: '/payment/cancel',
  }

  // Mock form submission
  const mockForm = {
    submit: jest.fn(),
  }
  jest
    .spyOn(document, 'createElement')
    .mockImplementation((tagName: string) => {
      if (tagName === 'form') {
        return mockForm as any
      }
      return {
        ...document.createElement(tagName),
      } as any
    })
})

afterEach(() => {
  process.env = originalEnv
  jest.restoreAllMocks()
})

describe('SepayCheckoutForm', () => {
  const defaultProps = {
    orderId: 'ORD-123',
    amount: 150000,
    description: 'Test payment',
    paymentMethod: 'BANK_TRANSFER' as const,
  }

  it('renders loading state initially', () => {
    render(<SepayCheckoutForm {...defaultProps} />)

    expect(screen.getByText('Đang chuẩn bị thanh toán...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders checkout form after loading', async () => {
    render(<SepayCheckoutForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Thanh toán SePay')).toBeInTheDocument()
    })

    expect(screen.getByText('ORD-123')).toBeInTheDocument()
    expect(screen.getByText('150.000 ₫')).toBeInTheDocument()
    expect(screen.getByText('Test payment')).toBeInTheDocument()
    expect(screen.getByText('Chuyển khoản ngân hàng')).toBeInTheDocument()
  })

  it('displays buyer information when provided', async () => {
    const props = {
      ...defaultProps,
      buyerInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0901234567',
      },
    }

    render(<SepayCheckoutForm {...props} />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('0901234567')).toBeInTheDocument()
    })
  })

  it('submits form when button is clicked', async () => {
    const mockOnSuccess = jest.fn()
    const createElementSpy = jest.spyOn(document, 'createElement')

    render(<SepayCheckoutForm {...defaultProps} onSuccess={mockOnSuccess} />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Thanh toán/ })
      ).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /Thanh toán/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(createElementSpy).toHaveBeenCalledWith('form')
    })

    expect(mockOnSuccess).toHaveBeenCalled()
  })

  it('shows error state when SDK fails', async () => {
    const { getCheckoutFields } = require('@/lib/sepay-sdk')
    getCheckoutFields.mockImplementation(() => {
      throw new Error('SDK initialization failed')
    })

    const mockOnError = jest.fn()
    render(<SepayCheckoutForm {...defaultProps} onError={mockOnError} />)

    await waitFor(() => {
      expect(screen.getByText('Lỗi thanh toán')).toBeInTheDocument()
      expect(screen.getByText('SDK initialization failed')).toBeInTheDocument()
    })

    expect(mockOnError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('formats currency correctly', async () => {
    render(<SepayCheckoutForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('150.000 ₫')).toBeInTheDocument()
    })
  })

  it('shows correct payment method badge', async () => {
    render(<SepayCheckoutForm {...defaultProps} />)

    await waitFor(() => {
      const badge = screen.getByText('Chuyển khoản ngân hàng')
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
    })
  })

  it('shows card payment method badge', async () => {
    const props = {
      ...defaultProps,
      paymentMethod: 'CARD' as const,
    }

    render(<SepayCheckoutForm {...props} />)

    await waitFor(() => {
      const badge = screen.getByText('Thẻ tín dụng/Ghi nợ')
      expect(badge).toHaveClass('bg-green-100', 'text-green-800')
    })
  })

  it('shows napas payment method badge', async () => {
    const props = {
      ...defaultProps,
      paymentMethod: 'NAPAS_BANK_TRANSFER' as const,
    }

    render(<SepayCheckoutForm {...props} />)

    await waitFor(() => {
      const badge = screen.getByText('Chuyển khoản NAPAS')
      expect(badge).toHaveClass('bg-purple-100', 'text-purple-800')
    })
  })

  it('has retry button in error state', async () => {
    const { getCheckoutFields } = require('@/lib/sepay-sdk')
    getCheckoutFields.mockImplementation(() => {
      throw new Error('Test error')
    })

    const reloadSpy = jest.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    })

    render(<SepayCheckoutForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Thử lại')).toBeInTheDocument()
    })

    const retryButton = screen.getByText('Thử lại')
    fireEvent.click(retryButton)

    expect(reloadSpy).toHaveBeenCalled()
  })

  it('shows loading state on submit', async () => {
    render(<SepayCheckoutForm {...defaultProps} />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Thanh toán/ })
      ).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /Thanh toán/ })
    fireEvent.click(submitButton)

    expect(screen.getByText('Đang xử lý...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('generates correct callback URLs', async () => {
    render(<SepayCheckoutForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Thanh toán SePay')).toBeInTheDocument()
    })

    const { createCheckoutFields } = require('@/lib/sepay-sdk')
    expect(createCheckoutFields).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: 'http://localhost:3000/payment/success?orderId=ORD-123',
        error_url: 'http://localhost:3000/payment/error?orderId=ORD-123',
        cancel_url: 'http://localhost:3000/payment/cancel?orderId=ORD-123',
      })
    )
  })
})
