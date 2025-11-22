'use client'

import * as React from 'react'
import { ProductCard } from './ProductCard'
import { cn } from '@/lib/utils'
import { getProducts } from '@/data/products'
import { useCart } from '@/stores/cart'
import type { Product } from '@/types/product'

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

const FeaturedProducts = React.forwardRef<
  HTMLDivElement,
  FeaturedProductsProps
>(
  (
    {
      products: productsProp,
      title = 'Sản phẩm nổi bật',
      description = 'Các tài khoản AI được yêu thích nhất',
      columns = { mobile: 1, tablet: 2, desktop: 3 },
      className,
      ...props
    },
    ref
  ) => {
    const [products, setProducts] = React.useState<Product[]>(
      productsProp || []
    )
    const [isLoading, setIsLoading] = React.useState(!productsProp)

    // Fetch products if not provided
    React.useEffect(() => {
      if (!productsProp) {
        getProducts()
          .then(setProducts)
          .finally(() => setIsLoading(false))
      }
    }, [productsProp])
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

    const { addItem } = useCart()

    const handleAddToCart = (productId: string) => {
      const product = products.find(p => p.id === productId)
      if (product) {
        addItem(product)
      }
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
            {isLoading
              ? // Loading skeleton
                Array.from({ length: 8 }, (_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="animate-pulse rounded-lg border bg-gray-100"
                  >
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-6 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))
              : products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    {...product}
                    priority={index < 6 ? true : false} // Priority for first 6 products (above fold)
                    loading={index < 6 ? 'eager' : 'lazy'} // Lazy load for products below fold
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
