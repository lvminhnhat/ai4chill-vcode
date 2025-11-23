'use client'

import { useCart } from '@/stores/cart'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useRouter } from 'next/navigation'

interface OrderSummaryProps {
  variant?: 'sidebar' | 'inline' // 'sidebar' for desktop, 'inline' for mobile/checkout page
}

export function OrderSummary({ variant = 'sidebar' }: OrderSummaryProps) {
  const { getTotal, getItemCount } = useCart()
  const router = useRouter()

  const subtotal = getTotal()
  const shipping = 0 // Free shipping
  const tax = 0 // No tax for MVP
  const total = subtotal + shipping + tax

  return (
    <Card className={variant === 'sidebar' ? 'sticky top-24' : ''}>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal ({getItemCount()} items)</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="text-green-600">Free</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={() => router.push('/checkout')}
          disabled={getItemCount() === 0}
        >
          Proceed to Checkout
        </Button>
      </CardFooter>
    </Card>
  )
}
