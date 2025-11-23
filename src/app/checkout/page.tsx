'use client'

import { useCart } from '@/stores/cart'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { OrderSummary } from '@/components/cart/OrderSummary'

export default function CheckoutPage() {
  const { items } = useCart()
  const router = useRouter()

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart')
    }
  }, [items.length, router])

  if (items.length === 0) {
    return null // or loading spinner
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="text-muted-foreground mt-2">
          Hoàn tất thông tin để đặt hàng
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form - 2 columns on desktop */}
        <div className="lg:col-span-2">
          <CheckoutForm />
        </div>

        {/* Order Summary - 1 column on desktop */}
        <div className="lg:col-span-1">
          <OrderSummary variant="inline" />
        </div>
      </div>
    </div>
  )
}
