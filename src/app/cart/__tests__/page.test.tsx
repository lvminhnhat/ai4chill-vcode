import { render, screen } from '@testing-library/react'
import { useCart } from '@/stores/cart'
import CartPage from '@/app/cart/page'

// Mock the cart store
jest.mock('@/stores/cart')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

const mockUseCart = useCart as jest.MockedFunction<typeof useCart>

describe('CartPage', () => {
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

  it('shows empty cart state when no items', () => {
    render(<CartPage />)

    expect(screen.getByText('Giỏ hàng của bạn đang trống')).toBeInTheDocument()
    expect(screen.getByText('Tiếp tục mua sắm')).toBeInTheDocument()
  })

  it('shows cart items when items exist', () => {
    const mockItems = [
      {
        productId: '1',
        title: 'Test Product',
        priceSnapshot: 100000,
        quantity: 2,
        image: '/test.jpg',
        stock: 10,
      },
    ]

    mockUseCart.mockReturnValue({
      items: mockItems,
      getItemCount: jest.fn().mockReturnValue(2),
      getTotal: jest.fn().mockReturnValue(200000),
      clearCart: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
    } as any)

    render(<CartPage />)

    expect(screen.getByText('Shopping Cart (2 items)')).toBeInTheDocument()
    expect(screen.getByText('Test Product')).toBeInTheDocument()
  })
})
