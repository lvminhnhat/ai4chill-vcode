import { render, screen } from '@testing-library/react'
import { describe, it, expect } from '@jest/globals'
import '@testing-library/jest-dom'
import TrustBar from '../TrustBar'

describe('TrustBar', () => {
  it('renders all three trust signals', () => {
    render(<TrustBar />)

    expect(screen.getByText('Instant Delivery')).toBeInTheDocument()
    expect(screen.getByText('30-Day Guarantee')).toBeInTheDocument()
    expect(screen.getByText('24/7 Support')).toBeInTheDocument()
  })

  it('renders descriptions for each trust signal', () => {
    render(<TrustBar />)

    expect(screen.getByText('Nhận tài khoản ngay lập tức')).toBeInTheDocument()
    expect(screen.getByText('Bảo hành 30 ngày')).toBeInTheDocument()
    expect(screen.getByText('Hỗ trợ 24/7')).toBeInTheDocument()
  })

  it('renders icons for each trust signal', () => {
    render(<TrustBar />)

    // Check for the presence of icons by looking for SVG elements
    const icons = document.querySelectorAll('svg')
    expect(icons.length).toBe(3)
  })

  it('applies custom className', () => {
    const { container } = render(<TrustBar className="custom-class" />)

    const div = container.querySelector('div')
    expect(div).toHaveClass('custom-class')
  })

  it('has correct structure and styling classes', () => {
    const { container } = render(<TrustBar />)

    // Main container
    const mainContainer = container.querySelector('div')
    expect(mainContainer).toHaveClass('bg-white', 'border-b', 'border-gray-200')

    // Grid container
    const gridContainer = container.querySelector('.grid')
    expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-3')
  })

  it('trust signals have hover effect classes', () => {
    const { container } = render(<TrustBar />)

    const trustItems = container.querySelectorAll('.group')
    expect(trustItems.length).toBe(3)

    // Check for hover classes on icon containers
    const iconContainers = container.querySelectorAll(
      '.group-hover\\:scale-110'
    )
    expect(iconContainers.length).toBe(3)
  })
})
