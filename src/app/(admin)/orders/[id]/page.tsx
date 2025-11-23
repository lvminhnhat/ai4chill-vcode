import { requireAdmin } from '@/lib/session-utils'
import { getOrderById, updateOrderStatus } from '@/app/actions/order-actions'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Calendar,
  User,
  Mail,
  Package,
  DollarSign,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { OrderStatus } from '@/generated/prisma'
import { OrderStatusUpdateForm } from '@/components/orders/OrderStatusUpdateForm'
import { FulfillOrderButton } from '@/components/orders/FulfillOrderButton'
import { OrderStockValidation } from '@/components/orders/OrderStockValidation'
import { checkOrderStockAvailability } from '@/app/actions/order-actions'

interface OrderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  PAID: {
    label: 'Paid',
    icon: DollarSign,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
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

function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount))
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  await requireAdmin()

  const { id } = await params
  const order = (await getOrderById(id)) as any

  if (!order) {
    notFound()
  }

  // Check stock availability for PAID orders
  let hasSufficientStock = true
  if (order.status === 'PAID') {
    try {
      const stockCheck = await checkOrderStockAvailability(
        order.orderItems.map((item: any) => ({
          variantId: item.variant.id,
          quantity: item.quantity,
        }))
      )
      hasSufficientStock = stockCheck.available
    } catch (error) {
      console.error('Error checking stock:', error)
      // Default to false if we can't check stock
      hasSufficientStock = false
    }
  }

  const statusInfo = statusConfig[order.status as OrderStatus]
  const StatusIcon = statusInfo.icon

  const canUpdateStatus = !['DELIVERED', 'CANCELLED'].includes(
    order.status as OrderStatus
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/orders">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-lg text-gray-600 mt-2">Order ID: {order.id}</p>
          </div>

          <div className="flex items-center space-x-3">
            <Badge
              className={`flex items-center space-x-2 ${statusInfo.color}`}
            >
              <StatusIcon className="h-4 w-4" />
              <span>{statusInfo.label}</span>
            </Badge>

            <FulfillOrderButton
              orderId={order.id}
              orderStatus={order.status}
              hasSufficientStock={hasSufficientStock}
            />

            {canUpdateStatus && (
              <OrderStatusUpdateForm
                orderId={order.id}
                currentStatus={order.status}
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-lg">{order.user.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-gray-400" />
                    {order.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Order Date
                  </p>
                  <p className="text-lg flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Last Updated
                  </p>
                  <p className="text-lg flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4 text-gray-400" />
                    {formatDate(order.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Validation for PAID orders */}
          {order.status === 'PAID' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Stock Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OrderStockValidation orderItems={order.orderItems} />
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Order Items ({order.orderItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.orderItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {item.product.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.variant.name}</p>
                          <p className="text-sm text-gray-500">
                            SKU: {item.variant.sku}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(item.price) * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Items ({order.orderItems.length})
                  </span>
                  <span className="font-medium">
                    {formatCurrency(
                      order.orderItems.reduce(
                        (sum: number, item: any) =>
                          sum + Number(item.price) * item.quantity,
                        0
                      )
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">Included</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      [
                        'PENDING',
                        'PROCESSING',
                        'SHIPPED',
                        'DELIVERED',
                      ].includes(order.status)
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  />
                  <div>
                    <p className="font-medium">Order Placed</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>

                {order.status !== 'PENDING' && (
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(
                          order.status
                        )
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                    <div>
                      <p className="font-medium">Paid</p>
                      <p className="text-sm text-gray-500">
                        Payment received successfully
                      </p>
                    </div>
                  </div>
                )}

                {['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(
                  order.status
                ) && (
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(
                          order.status
                        )
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                    <div>
                      <p className="font-medium">Processing</p>
                      <p className="text-sm text-gray-500">
                        Order is being prepared
                      </p>
                    </div>
                  </div>
                )}

                {order.status === 'SHIPPED' && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium">Shipped</p>
                      <p className="text-sm text-gray-500">
                        Order is on the way
                      </p>
                    </div>
                  </div>
                )}

                {order.status === 'DELIVERED' && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div>
                      <p className="font-medium">Delivered</p>
                      <p className="text-sm text-gray-500">
                        Order completed successfully
                      </p>
                    </div>
                  </div>
                )}

                {order.status === 'CANCELLED' && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div>
                      <p className="font-medium">Cancelled</p>
                      <p className="text-sm text-gray-500">
                        Order was cancelled
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
