'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { VariantSelector } from './VariantSelector'
import { formatCurrency } from '@/lib/format'
import { useCart } from '@/stores/cart'
import { toast } from 'sonner'
import type { Product, Variant } from '@/types/product'

interface ProductInfoProps {
  product: Product
  variants: Variant[]
}

export function ProductInfo({ product, variants }: ProductInfoProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?.id || ''
  )
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()

  const selectedVariant = useMemo(
    () => variants.find(v => v.id === selectedVariantId),
    [variants, selectedVariantId]
  )

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error('Vui lòng chọn gói dịch vụ')
      return
    }

    if (selectedVariant.stock === 0) {
      toast.error('Gói dịch vụ này đã hết hàng')
      return
    }

    if (quantity > selectedVariant.stock) {
      toast.error(`Chỉ còn ${selectedVariant.stock} sản phẩm có sẵn`)
      return
    }

    addItem(
      {
        id: product.id,
        title: product.title,
        price: selectedVariant.price,
        image: product.image,
        stock: selectedVariant.stock,
        slug: product.slug || '',
        rating: product.rating || 0,
      },
      quantity,
      selectedVariant.id,
      selectedVariant.name
    )

    toast.success(`Đã thêm ${quantity}x ${product.title} vào giỏ hàng!`)
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Hết hàng', className: 'text-red-600' }
    if (stock <= 5)
      return {
        text: `Chỉ còn ${stock} sản phẩm!`,
        className: 'text-orange-600',
      }
    return { text: 'Còn hàng', className: 'text-green-600' }
  }

  const stockStatus = useMemo(
    () => (selectedVariant ? getStockStatus(selectedVariant.stock) : null),
    [selectedVariant]
  )

  return (
    <div className="space-y-6">
      {/* Product Title and Category */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{product.title}</h1>
          {product.category && (
            <Badge variant="secondary">{product.category}</Badge>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {product.rating} (
            {(Math.floor(product.id.charCodeAt(0) * 7 + 23) % 100) + 20}{' '}
            reviews)
          </span>
        </div>
      </div>

      {/* Price Display */}
      <div className="space-y-2">
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-blue-600">
            {selectedVariant
              ? formatCurrency(selectedVariant.price)
              : formatCurrency(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-lg text-gray-500 line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
        </div>
        {stockStatus && (
          <span className={`text-sm font-medium ${stockStatus.className}`}>
            {stockStatus.text}
          </span>
        )}
      </div>

      {/* Description */}
      {product.description && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Description</h3>
          <p className="text-gray-600 leading-relaxed">{product.description}</p>
        </div>
      )}

      {/* Variant Selector */}
      {variants.length > 0 && (
        <VariantSelector
          variants={variants}
          selectedVariantId={selectedVariantId}
          onVariantChange={setSelectedVariantId}
        />
      )}

      {/* Quantity and Add to Cart */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="quantity" className="text-sm font-medium">
              Quantity:
            </label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={selectedVariant?.stock || 1}
              value={quantity}
              onChange={e => {
                const val = parseInt(e.target.value) || 1
                const max = selectedVariant?.stock || 1
                setQuantity(Math.min(Math.max(1, val), max))
              }}
              className="w-20"
              aria-label="Số lượng sản phẩm"
              aria-describedby="quantity-help"
            />
          </div>

          {selectedVariant && (
            <span id="quantity-help" className="text-sm text-gray-600">
              Tối đa: {selectedVariant.stock} sản phẩm có sẵn
            </span>
          )}
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={!selectedVariant || selectedVariant.stock === 0}
          className="w-full py-3 text-lg"
          size="lg"
          aria-label={
            !selectedVariant
              ? 'Vui lòng chọn gói dịch vụ'
              : selectedVariant.stock === 0
                ? 'Sản phẩm hết hàng'
                : `Thêm ${quantity} ${product.title} vào giỏ hàng`
          }
        >
          {!selectedVariant
            ? 'Select a Plan'
            : selectedVariant.stock === 0
              ? 'Out of Stock'
              : 'Add to Cart'}
        </Button>
      </div>
    </div>
  )
}
