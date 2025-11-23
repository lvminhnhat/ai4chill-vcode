'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Package } from 'lucide-react'
import { logger } from '@/lib/logger'

interface StockInfo {
  variantId: string
  variantName: string
  productName: string
  required: number
  available: number
  isSufficient: boolean
}

interface OrderStockValidationProps {
  orderItems: Array<{
    id: string
    quantity: number
    variant: {
      id: string
      name: string
      duration: string
    }
    product: {
      name: string
    }
  }>
}

export function OrderStockValidation({
  orderItems,
}: OrderStockValidationProps) {
  const [stockInfo, setStockInfo] = useState<StockInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStockInfo = async () => {
      try {
        const response = await fetch('/api/admin/stock/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: orderItems.map(item => ({
              variantId: item.variant.id,
              quantity: item.quantity,
            })),
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setStockInfo(data.stockInfo)
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error('Failed to fetch stock information', {
            errorMessage: error.message,
            orderItemsCount: orderItems.length,
            stack: error.stack,
          })
        } else {
          logger.error('Unknown error fetching stock info', {
            error,
            orderItemsCount: orderItems.length,
          })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStockInfo()
  }, [orderItems])

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Package className="h-4 w-4 animate-pulse" />
        <span>Checking stock availability...</span>
      </div>
    )
  }

  const hasInsufficientStock = stockInfo.some(info => !info.isSufficient)

  if (!hasInsufficientStock) {
    return (
      <div className="flex items-center space-x-2 text-sm text-green-600">
        <Package className="h-4 w-4" />
        <span>All items in stock - Ready to fulfill</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-sm text-amber-600">
        <AlertCircle className="h-4 w-4" />
        <span>Stock Warning - Some items need restocking</span>
      </div>

      <div className="space-y-2">
        {stockInfo
          .filter(info => !info.isSufficient)
          .map((info, index) => (
            <div
              key={info.variantId}
              className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-md"
            >
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {info.productName} - {info.variantName}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Required: {info.required} | Available: {info.available}
                </div>
              </div>
              <Badge variant="destructive" className="text-xs">
                Short {info.required - info.available}
              </Badge>
            </div>
          ))}
      </div>

      <div className="text-xs text-gray-600">
        <p>
          Please add more stock to the inventory before fulfilling this order.
        </p>
        <p>You can add stock from the Inventory Management page.</p>
      </div>
    </div>
  )
}
