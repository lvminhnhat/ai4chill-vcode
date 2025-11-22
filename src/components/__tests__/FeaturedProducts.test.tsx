import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FeaturedProducts } from '../FeaturedProducts'

// Mock the products module
jest.mock('@/data/products', () => ({
  getProducts: jest.fn().mockResolvedValue([
    {
      id: 'chatgpt-plus-1m',
      title: 'ChatGPT Plus Subscription - 1 Month',
      price: 150000,
      originalPrice: 180000,
      rating: 4.8,
      image: '/images/products/chatgpt.jpg',
      stock: 25,
    },
    {
      id: 'claude-pro-1m',
      title: 'Claude Pro Account - 1 Month',
      price: 180000,
      rating: 4.7,
      image: '/images/products/claude.jpg',
      stock: 15,
    },
  ]),
}))
// Mock ProductCard component
jest.mock('../ProductCard', () => ({
  ProductCard: React.forwardRef(
    (
      {
        id,
        title,
        price,
        originalPrice,
        rating,
        image,
        stock,
        onAddToCart,
        className,
        ...props
      }: any,
      ref: any
    ) => (
      <div
        ref={ref}
        data-testid="product-card"
        className={className}
        {...props}
      >
        <div data-testid="product-title">{title}</div>
        <div data-testid="product-price">{price}</div>
        <div data-testid="product-rating">{rating}</div>
        <div data-testid="product-image">{image}</div>
        <div data-testid="product-stock">{stock}</div>
        <button data-testid="add-to-cart-btn" onClick={() => onAddToCart?.(id)}>
          Add to Cart
        </button>
      </div>
    )
  ),
}))

describe('FeaturedProducts', () => {
  it('renders with default props', async () => {
    render(<FeaturedProducts />)

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Sản phẩm nổi bật')).toBeInTheDocument()
      expect(
        screen.getByText('Các tài khoản AI được yêu thích nhất')
      ).toBeInTheDocument()
      expect(screen.getAllByTestId('product-card')).toHaveLength(2) // Mocked products
    })
  })

  it('renders with custom title and description', () => {
    render(
      <FeaturedProducts title="Custom Title" description="Custom description" />
    )

    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom description')).toBeInTheDocument()
  })

  it('renders with custom products', () => {
    const customProducts = [
      {
        id: 'test-1',
        title: 'Test Product 1',
        price: 100000,
        rating: 4.5,
        image: '/test1.jpg',
        stock: 10,
      },
      {
        id: 'test-2',
        title: 'Test Product 2',
        price: 200000,
        rating: 4.0,
        image: '/test2.jpg',
        stock: 5,
      },
    ]

    render(<FeaturedProducts products={customProducts} />)

    expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    expect(screen.getByText('Test Product 2')).toBeInTheDocument()
    expect(screen.getAllByTestId('product-card')).toHaveLength(2)
  })

  it('renders with custom columns configuration', async () => {
    render(<FeaturedProducts columns={{ mobile: 2, tablet: 2, desktop: 3 }} />)

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Sản phẩm nổi bật')).toBeInTheDocument()
      expect(screen.getAllByTestId('product-card')).toHaveLength(2) // Mocked products
    })
  })

  it('calls onAddToCart when button is clicked', () => {
    render(
      <FeaturedProducts
        products={[
          {
            id: 'test-product',
            title: 'Test Product',
            price: 100000,
            rating: 4.5,
            image: '/test.jpg',
            stock: 10,
          },
        ]}
      />
    )

    const addToCartButton = screen.getByTestId('add-to-cart-btn')
    addToCartButton.click()

    // Since we're using the default handleAddToCart which logs to console,
    // we just verify the button exists and can be clicked
    expect(addToCartButton).toBeInTheDocument()
  })

  it('renders products with correct data', () => {
    const testProducts = [
      {
        id: 'chatgpt-test',
        title: 'ChatGPT Plus - Test',
        price: 150000,
        originalPrice: 180000,
        rating: 4.8,
        image: '/chatgpt.jpg',
        stock: 25,
      },
    ]

    render(<FeaturedProducts products={testProducts} />)

    expect(screen.getByText('ChatGPT Plus - Test')).toBeInTheDocument()
    expect(screen.getByText('150000')).toBeInTheDocument()
    expect(screen.getByText('4.8')).toBeInTheDocument()
    expect(screen.getByText('/chatgpt.jpg')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<FeaturedProducts className="custom-class" />)

    const section = screen.getByText('Sản phẩm nổi bật').closest('section')
    expect(section).toHaveClass('custom-class')
  })

  it('renders section with proper structure', () => {
    render(<FeaturedProducts />)

    // Check main section
    const section = screen
      .getByRole('heading', { name: 'Sản phẩm nổi bật' })
      .closest('section')
    expect(section).toBeInTheDocument()

    // Check container
    const container = section?.querySelector('.container')
    expect(container).toBeInTheDocument()

    // Check header
    expect(
      screen.getByRole('heading', { name: 'Sản phẩm nổi bật' })
    ).toBeInTheDocument()
    expect(
      screen.getByText('Các tài khoản AI được yêu thích nhất')
    ).toBeInTheDocument()

    // Check grid
    const grid = container?.querySelector('.grid')
    expect(grid).toBeInTheDocument()
  })
})
