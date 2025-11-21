'use client'

import * as React from 'react'
import { ProductCard } from './ProductCard'
import { cn } from '@/lib/utils'

export interface Product {
  id: string
  title: string
  price: number
  originalPrice?: number
  rating: number
  image: string
  stock: number
}

export interface FeaturedProductsProps {
  products?: Product[]
  title?: string
  description?: string
  columns?: {
    mobile: number
    tablet: number
    desktop: number
  }
  className?: string
}

// Mock data for AI accounts marketplace
const mockProducts: Product[] = [
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
  {
    id: 'midjourney-basic',
    title: 'Midjourney Basic Plan - 1 Month',
    price: 120000,
    originalPrice: 150000,
    rating: 4.6,
    image: '/images/products/midjourney.jpg',
    stock: 8,
  },
  {
    id: 'gemini-advanced',
    title: 'Gemini Advanced Subscription - 1 Month',
    price: 140000,
    rating: 4.5,
    image: '/images/products/gemini.jpg',
    stock: 32,
  },
  {
    id: 'dalle-credits-100',
    title: 'DALL-E Credits - 100 Generations',
    price: 200000,
    originalPrice: 250000,
    rating: 4.9,
    image: '/images/products/dalle.jpg',
    stock: 5,
  },
  {
    id: 'github-copilot-1m',
    title: 'GitHub Copilot Individual - 1 Month',
    price: 130000,
    rating: 4.7,
    image: '/images/products/github-copilot.jpg',
    stock: 18,
  },
  {
    id: 'chatgpt-team-1m',
    title: 'ChatGPT Team Subscription - 1 Month',
    price: 350000,
    rating: 4.8,
    image: '/images/products/chatgpt-team.jpg',
    stock: 12,
  },
  {
    id: 'claude-api-credits',
    title: 'Claude API Credits - $50 Worth',
    price: 500000,
    rating: 4.6,
    image: '/images/products/claude-api.jpg',
    stock: 3,
  },
]

const FeaturedProducts = React.forwardRef<
  HTMLDivElement,
  FeaturedProductsProps
>(
  (
    {
      products = mockProducts,
      title = 'Sản phẩm nổi bật',
      description = 'Các tài khoản AI được yêu thích nhất',
      columns = { mobile: 1, tablet: 2, desktop: 3 },
      className,
      ...props
    },
    ref
  ) => {
    const getGridClasses = () => {
      const { mobile, tablet, desktop } = columns

      // Use predefined Tailwind classes to avoid dynamic class generation
      if (mobile === 1 && tablet === 2 && desktop === 3) {
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }
      if (mobile === 1 && tablet === 2 && desktop === 4) {
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      }
      if (mobile === 1 && tablet === 3 && desktop === 3) {
        return 'grid-cols-1 md:grid-cols-3'
      }
      if (mobile === 2 && tablet === 2 && desktop === 3) {
        return 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3'
      }

      // Default fallback
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }

    const handleAddToCart = (productId: string) => {
      console.log('Added to cart:', productId)
      // TODO: Implement cart functionality
    }

    return (
      <section ref={ref} className={cn('py-16', className)} {...props}>
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-blue-600 sm:text-4xl">
              {title}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {description}
            </p>
          </div>

          {/* Products Grid */}
          <div className={cn('grid gap-6', getGridClasses())}>
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                {...product}
                priority={index < 6} // Priority for first 6 products (above fold)
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </div>
      </section>
    )
  }
)

FeaturedProducts.displayName = 'FeaturedProducts'

export { FeaturedProducts }
