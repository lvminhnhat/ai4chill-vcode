import { render, screen } from '@testing-library/react'
import { useCart } from '@/stores/cart'
import { OrderSummary } from '@/components/cart/OrderSummary'

// Mock the cart store
jest.mock('@/stores/cart')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

const mockUseCart = useCart as jest.MockedFunction<typeof useCart>

describe('OrderSummary', () => {
  beforeEach(() => {
    mockUseCart.mockReturnValue({
      items: [],
      getItemCount: jest.fn().mockReturnValue(0),
      getTotal: jest.fn().mockReturnValue(0),
      clearCart: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
    } as any)
  })

  it('displays order summary correctly', () => {
    mockUseCart.mockReturnValue({
      items: [],
      getItemCount: jest.fn().mockReturnValue(2),
      getTotal: jest.fn().mockReturnValue(200000),
      clearCart: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
    } as any)

    render(<OrderSummary />)

    expect(screen.getByText('Order Summary')).toBeInTheDocument()
    expect(screen.getByText('Subtotal (2 items)')).toBeInTheDocument()
    expect(screen.getAllByText('200.000 ₫')).toHaveLength(2)
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('disables checkout button when cart is empty', () => {
    render(<OrderSummary />)

    const checkoutButton = screen.getByRole('button', {
      name: /proceed to checkout/i,
    })
    expect(checkoutButton).toBeDisabled()
  })

  it('enables checkout button when cart has items', () => {
    mockUseCart.mockReturnValue({
      items: [{ productId: '1' }],
      getItemCount: jest.fn().mockReturnValue(1),
      getTotal: jest.fn().mockReturnValue(100000),
      clearCart: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
    } as any)

    render(<OrderSummary />)

    const checkoutButton = screen.getByRole('button', {
      name: /proceed to checkout/i,
    })
    expect(checkoutButton).not.toBeDisabled()
  })
})
