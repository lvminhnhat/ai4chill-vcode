import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard } from '../ProductCard'

describe('ProductCard', () => {
  const mockProps = {
    id: '1',
    title: 'Test Product',
    price: 100000,
    rating: 4.5,
    image: '/test-image.jpg',
    stock: 10,
    onAddToCart: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders product information correctly', () => {
    render(<ProductCard {...mockProps} />)

    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('100.000 ₫')).toBeInTheDocument()
    expect(screen.getByText('In Stock')).toBeInTheDocument()
    expect(screen.getByText('Add to Cart')).toBeInTheDocument()
  })

  it('displays rating stars correctly', () => {
    render(<ProductCard {...mockProps} />)

    const stars = screen.getAllByTestId('star-icon')
    expect(stars).toHaveLength(5)

    // 4 filled stars for rating 4.5
    const filledStars = stars.filter(star =>
      star.classList.contains('fill-yellow-400')
    )
    expect(filledStars).toHaveLength(4)
  })

  it('shows discount when originalPrice is provided', () => {
    const propsWithDiscount = {
      ...mockProps,
      originalPrice: 150000,
    }

    render(<ProductCard {...propsWithDiscount} />)

    expect(screen.getByText('150.000 ₫')).toBeInTheDocument()
    expect(screen.getByText('-33%')).toBeInTheDocument()
  })

  it('shows low stock status when stock <= 5', () => {
    const propsWithLowStock = {
      ...mockProps,
      stock: 3,
    }

    render(<ProductCard {...propsWithLowStock} />)

    expect(screen.getByText('Low Stock')).toBeInTheDocument()
  })

  it('shows out of stock status when stock = 0', () => {
    const propsWithNoStock = {
      ...mockProps,
      stock: 0,
    }

    render(<ProductCard {...propsWithNoStock} />)

    expect(screen.getAllByText('Out of Stock')).toHaveLength(2)
    const outOfStockButton = screen.getByRole('button', {
      name: 'Out of Stock',
    })
    expect(outOfStockButton).toBeDisabled()
  })

  it('calls onAddToCart when Add to Cart button is clicked', () => {
    render(<ProductCard {...mockProps} />)

    const addButton = screen.getByText('Add to Cart')
    fireEvent.click(addButton)

    expect(mockProps.onAddToCart).toHaveBeenCalledWith('1')
  })

  it('does not call onAddToCart when out of stock', () => {
    const propsWithNoStock = {
      ...mockProps,
      stock: 0,
    }

    render(<ProductCard {...propsWithNoStock} />)

    const outOfStockButton = screen.getByRole('button', {
      name: 'Out of Stock',
    })
    fireEvent.click(outOfStockButton)

    expect(mockProps.onAddToCart).not.toHaveBeenCalled()
  })
})
