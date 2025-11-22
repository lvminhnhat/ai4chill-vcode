'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { fulfillOrder } from '@/app/actions/order-actions'
import { Loader2, Package, CheckCircle } from 'lucide-react'

interface FulfillOrderButtonProps {
  orderId: string
  orderStatus: string
  hasSufficientStock?: boolean
  onFulfillmentComplete?: () => void
}

export function FulfillOrderButton({
  orderId,
  orderStatus,
  hasSufficientStock = true,
  onFulfillmentComplete,
}: FulfillOrderButtonProps) {
  const [isFulfilling, setIsFulfilling] = useState(false)

  // Only show button for PAID orders
  if (orderStatus !== 'PAID') {
    return null
  }

  // Disable button if insufficient stock
  const isDisabled = isFulfilling || !hasSufficientStock

  const handleFulfillOrder = async () => {
    if (isFulfilling) return

    setIsFulfilling(true)

    try {
      const result = await fulfillOrder(orderId)

      if (result.success) {
        toast.success(result.message, {
          duration: 5000,
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        })

        // Refresh the page data after successful fulfillment
        if (onFulfillmentComplete) {
          onFulfillmentComplete()
        } else {
          // Fallback: reload the page
          window.location.reload()
        }
      } else {
        toast.error(result.message, {
          duration: 8000,
          icon: <Package className="h-4 w-4 text-red-500" />,
        })
      }
    } catch (error) {
      console.error('Fulfillment error:', error)
      toast.error('An unexpected error occurred during fulfillment', {
        duration: 5000,
      })
    } finally {
      setIsFulfilling(false)
    }
  }

  return (
    <Button
      onClick={handleFulfillOrder}
      disabled={isDisabled}
      className={`${hasSufficientStock ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'} text-white`}
      size="sm"
      title={
        !hasSufficientStock
          ? 'Insufficient stock to fulfill this order'
          : undefined
      }
    >
      {isFulfilling ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Fulfilling...
        </>
      ) : (
        <>
          <Package className="mr-2 h-4 w-4" />
          {hasSufficientStock ? 'Fulfill Order' : 'Insufficient Stock'}
        </>
      )}
    </Button>
  )
}
