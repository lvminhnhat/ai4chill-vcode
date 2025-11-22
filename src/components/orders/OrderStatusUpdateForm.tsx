'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { OrderStatus } from '@/generated/prisma'
import { updateOrderStatus } from '@/app/actions/order-actions'
import {
  MoreHorizontal,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'

interface OrderStatusUpdateFormProps {
  orderId: string
  currentStatus: OrderStatus
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    icon: Package,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  PAID: {
    label: 'Paid',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  PROCESSING: {
    label: 'Processing',
    icon: Package,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  SHIPPED: {
    label: 'Shipped',
    icon: Truck,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  DELIVERED: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
  },
}

const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

export function OrderStatusUpdateForm({
  orderId,
  currentStatus,
}: OrderStatusUpdateFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const availableStatuses = statusTransitions[currentStatus]

  if (availableStatuses.length === 0) {
    return null
  }

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setIsLoading(true)

    try {
      await updateOrderStatus(orderId, newStatus)
      router.refresh()
    } catch (error) {
      console.error('Failed to update status:', error)
      // You could add a toast notification here
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
          Update Status
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableStatuses.map(status => {
          const config = statusConfig[status]
          const Icon = config.icon

          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusUpdate(status)}
              className="flex items-center space-x-2"
            >
              <Icon className="h-4 w-4" />
              <span>{config.label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
