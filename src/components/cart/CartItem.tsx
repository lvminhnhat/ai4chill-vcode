'use client'
import Image from 'next/image'
import { X, Plus, Minus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCart } from '@/stores/cart'
import { formatCurrency } from '@/lib/format'
import type { CartItem as CartItemType } from '@/types/product'

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart()

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(item.productId)
    } else {
      updateQuantity(item.productId, newQuantity)
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      {/* Product Image */}
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="h-full w-full bg-gray-100" />
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium truncate">{item.title}</h3>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(item.priceSnapshot)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(item.quantity - 1)}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-sm">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(item.quantity + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={() => removeItem(item.productId)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
