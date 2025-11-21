import { render, screen } from '@testing-library/react'
import Home from '../page'

// Mock the components to avoid rendering complexity in unit tests
jest.mock('@/components', () => ({
  HeroSection: () => <div data-testid="hero-section">Hero Section</div>,
  TrustBar: () => <div data-testid="trust-bar">Trust Bar</div>,
  FeaturedProducts: () => (
    <div data-testid="featured-products">Featured Products</div>
  ),
}))

describe('Home Page', () => {
  it('renders all required components', () => {
    render(<Home />)

    // Check that all components are rendered
    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
    expect(screen.getByTestId('trust-bar')).toBeInTheDocument()
    expect(screen.getByTestId('featured-products')).toBeInTheDocument()
  })

  it('has proper semantic structure', () => {
    render(<Home />)

    // Check for main element
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()

    // Check for products section with id
    const productsSection = document.getElementById('products')
    expect(productsSection).toBeInTheDocument()
  })

  it('maintains correct component order', () => {
    render(<Home />)

    const main = screen.getByRole('main')
    const heroSection = screen.getByTestId('hero-section')
    const trustBar = screen.getByTestId('trust-bar')
    const featuredProducts = screen.getByTestId('featured-products')

    // Check that components are in the correct order
    expect(main).toContainElement(heroSection)
    expect(main).toContainElement(trustBar)
    expect(main).toContainElement(featuredProducts)

    // Check DOM order
    expect(
      heroSection.compareDocumentPosition(trustBar) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      trustBar.compareDocumentPosition(featuredProducts) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('applies correct CSS classes', () => {
    render(<Home />)

    const main = screen.getByRole('main')
    expect(main).toHaveClass('min-h-screen')

    const productsSection = document.getElementById('products')
    expect(productsSection?.tagName).toBe('SECTION')
  })
})
