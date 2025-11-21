import { render, screen } from '@testing-library/react'
import { describe, it, expect } from '@jest/globals'
import '@testing-library/jest-dom'
import HeroSection from '../HeroSection'

describe('HeroSection', () => {
  it('renders with default props', () => {
    render(<HeroSection />)

    expect(
      screen.getByText('Tài khoản AI & Premium Tools - Uy tín, Nhanh chóng')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Cung cấp tài khoản ChatGPT, Claude, Midjourney và các công cụ AI hàng đầu với giá tốt nhất thị trường'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Xem sản phẩm ngay')).toBeInTheDocument()
    expect(screen.getByText('Tìm hiểu thêm')).toBeInTheDocument()
  })

  it('renders with custom props', () => {
    const customProps = {
      title: 'Custom Title',
      subtitle: 'Custom Subtitle',
      primaryCta: { text: 'Custom Primary', href: '/custom-primary' },
      secondaryCta: { text: 'Custom Secondary', href: '/custom-secondary' },
    }

    render(<HeroSection {...customProps} />)

    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom Subtitle')).toBeInTheDocument()
    expect(screen.getByText('Custom Primary')).toBeInTheDocument()
    expect(screen.getByText('Custom Secondary')).toBeInTheDocument()
  })

  it('renders without image when showImage is false', () => {
    render(<HeroSection showImage={false} />)

    expect(screen.queryByText('🤖')).not.toBeInTheDocument()
    expect(screen.queryByText('AI Tools')).not.toBeInTheDocument()
  })

  it('renders with image by default', () => {
    render(<HeroSection />)

    expect(screen.getByText('🤖')).toBeInTheDocument()
    expect(screen.getByText('AI Tools')).toBeInTheDocument()
    expect(screen.getByText('Premium Accounts')).toBeInTheDocument()
  })

  it('primary CTA links to correct href', () => {
    render(<HeroSection />)

    const primaryButton = screen.getByText('Xem sản phẩm ngay')
    expect(primaryButton.closest('a')).toHaveAttribute('href', '#products')
  })

  it('secondary CTA links to correct href', () => {
    render(<HeroSection />)

    const secondaryButton = screen.getByText('Tìm hiểu thêm')
    expect(secondaryButton.closest('a')).toHaveAttribute('href', '/about')
  })

  it('applies custom className', () => {
    const { container } = render(<HeroSection className="custom-class" />)

    const section = container.querySelector('section')
    expect(section).toHaveClass('custom-class')
  })
})
