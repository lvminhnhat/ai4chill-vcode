'use client'

import * as React from 'react'
import Image from 'next/image'
import { Star } from 'lucide-react'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'

export interface ProductCardProps {
  id: string
  title: string
  price: number
  originalPrice?: number
  rating: number
  image: string
  stock: number
  onAddToCart?: (id: string) => void
  priority?: boolean
  loading?: 'lazy' | 'eager'
}

// Fallback image for error handling
const FALLBACK_IMAGE = '/images/placeholder.jpg'
const ProductCard = React.forwardRef<
  HTMLDivElement,
  ProductCardProps & React.HTMLAttributes<HTMLDivElement>
>(
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
      priority = false,
      loading,
      className,
      ...props
    },
    ref
  ) => {
    const [imageSrc, setImageSrc] = React.useState(image)
    const getStockStatus = () => {
      if (stock === 0)
        return {
          text: 'Out of Stock',
          className: 'bg-destructive text-destructive-foreground',
        }
      if (stock <= 5)
        return { text: 'Low Stock', className: 'bg-yellow-500 text-white' }
      return { text: 'In Stock', className: 'bg-green-500 text-white' }
    }

    const stockStatus = getStockStatus()
    const hasDiscount = originalPrice && originalPrice > price
    const discountPercentage = hasDiscount
      ? Math.round(((originalPrice! - price) / originalPrice!) * 100)
      : 0

    const renderStars = () => {
      return Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          data-testid="star-icon"
          className={cn(
            'h-4 w-4',
            index < Math.floor(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-gray-200 text-gray-200'
          )}
        />
      ))
    }

    return (
      <Card
        ref={ref}
        className={cn(
          'group overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02]',
          className
        )}
        {...props}
      >
        <CardContent className="p-0">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden">
            <Image
              src={imageSrc}
              alt={title}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              loading={loading || (priority ? 'eager' : 'lazy')}
              {...(priority && { priority: true })}
              onError={() => {
                // Fallback to placeholder on error
                setImageSrc(FALLBACK_IMAGE)
              }}
            />

            {/* Discount Badge */}
            {hasDiscount && (
              <div className="absolute left-2 top-2 rounded-md bg-red-500 px-2 py-1 text-xs font-medium text-white">
                -{discountPercentage}%
              </div>
            )}

            {/* Stock Status Badge */}
            <div
              className={cn(
                'absolute right-2 top-2 rounded-md px-2 py-1 text-xs font-medium',
                stockStatus.className
              )}
            >
              {stockStatus.text}
            </div>
          </div>

          {/* Product Info */}
          <div className="p-4">
            {/* Product Title */}
            <h3 className="mb-2 line-clamp-2 text-sm font-medium leading-tight text-card-foreground group-hover:text-primary">
              {title}
            </h3>

            {/* Rating */}
            <div className="mb-3 flex items-center gap-1">
              {renderStars()}
              <span className="ml-1 text-xs text-muted-foreground">
                ({rating.toFixed(1)})
              </span>
            </div>

            {/* Price */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-lg font-bold text-primary">
                {formatCurrency(price)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(originalPrice!)}
                </span>
              )}
            </div>
          </div>
        </CardContent>

        {/* Add to Cart Button */}
        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            variant={stock === 0 ? 'outline' : 'default'}
            disabled={stock === 0}
            onClick={() => onAddToCart?.(id)}
          >
            {stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </CardFooter>
      </Card>
    )
  }
)

ProductCard.displayName = 'ProductCard'

export { ProductCard }
