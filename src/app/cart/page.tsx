'use client'

import { useCart } from '@/stores/cart'
import { CartItem } from '@/components/cart/CartItem'
import { OrderSummary } from '@/components/cart/OrderSummary'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function EmptyCartState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <ShoppingCart className="w-24 h-24 text-muted-foreground" />
      <h2 className="text-2xl font-semibold">Giỏ hàng của bạn đang trống</h2>
      <p className="text-muted-foreground">
        Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
      </p>
      <Button asChild>
        <Link href="/products">Tiếp tục mua sắm</Link>
      </Button>
    </div>
  )
}

export default function CartPage() {
  const { items, getItemCount, clearCart } = useCart()
  const router = useRouter()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyCartState />
      </div>
    )
  }

  const handleClearCart = () => {
    if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
      clearCart()
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        Shopping Cart ({getItemCount()} items)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items - takes 2 columns on desktop */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <CartItem
              key={item.productId + (item.variantId || '')}
              item={item}
            />
          ))}

          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => router.push('/products')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tiếp tục mua sắm
            </Button>
            <Button
              variant="ghost"
              onClick={handleClearCart}
              className="text-destructive hover:text-destructive"
            >
              Xóa giỏ hàng
            </Button>
          </div>
        </div>

        {/* Order summary - takes 1 column on desktop */}
        <div>
          <OrderSummary variant="sidebar" />
        </div>
      </div>
    </div>
  )
}
