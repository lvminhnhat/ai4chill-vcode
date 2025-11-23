'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { fulfillOrder } from '@/app/actions/order-actions'
import { Loader2, Package, CheckCircle } from 'lucide-react'
import { logger } from '@/lib/logger'

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
        toast.success(`Order ${result.order?.id} marked as processing`, {
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
        toast.error(result.error, {
          duration: 8000,
          icon: <Package className="h-4 w-4 text-red-500" />,
        })
      }
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('stock') ||
          error.message.includes('inventory')
        ) {
          toast.error(
            'Không thể hoàn tất đơn hàng do không đủ hàng trong kho.',
            {
              duration: 5000,
            }
          )
        } else if (
          error.message.includes('permission') ||
          error.message.includes('unauthorized')
        ) {
          toast.error('Bạn không có quyền thực hiện thao tác này.', {
            duration: 5000,
          })
        } else {
          toast.error('Đã xảy ra lỗi khi xử lý đơn hàng. Vui lòng thử lại.', {
            duration: 5000,
          })
        }
        logger.error('Order fulfillment failed', {
          orderId,
          errorMessage: error.message,
          stack: error.stack,
        })
      } else {
        toast.error('Đã xảy ra lỗi không xác định. Vui lòng liên hệ hỗ trợ.', {
          duration: 5000,
        })
        logger.error('Unknown fulfillment error', { orderId, error })
      }
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
