'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Package, CreditCard, Clock } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface OrderDetails {
  id: string
  status: string
  total: number
  invoiceNumber: string
  paymentMethod?: string
  createdAt: string
  user: {
    name: string
    email: string
  }
  items: Array<{
    id: string
    quantity: number
    price: number
    product: {
      id: string
      name: string
    }
    variant?: {
      id: string
      name: string
    }
  }>
  transaction?: {
    id: string
    status: string
    amount: number
    provider: string
    createdAt: string
  }
}

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(5)

  const orderId = searchParams.get('orderId')

  useEffect(() => {
    if (!orderId) {
      setError('Không tìm thấy ID đơn hàng')
      setLoading(false)
      return
    }

    fetchOrderDetails(orderId)
  }, [orderId])

  useEffect(() => {
    if (order && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (order && countdown === 0) {
      router.push(`/orders/${orderId}`)
    }
  }, [countdown, order, orderId, router])

  const fetchOrderDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`)

      if (!response.ok) {
        throw new Error('Không thể tải thông tin đơn hàng')
      }

      const data = await response.json()
      setOrder(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Lỗi</CardTitle>
            <CardDescription>
              {error || 'Không tìm thấy thông tin đơn hàng'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/">
              <Button className="w-full">Về trang chủ</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Thanh toán thành công!
          </h1>
          <p className="text-gray-600">
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được xác nhận.
          </p>
          {countdown > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Tự động chuyển đến trang chi tiết đơn hàng sau {countdown} giây...
            </p>
          )}
        </div>

        {/* Order Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Thông tin đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Mã đơn hàng</p>
                <p className="font-medium">{order.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Trạng thái</p>
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  {order.status === 'PAID' ? 'Đã thanh toán' : order.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tổng tiền</p>
                <p className="font-semibold text-lg text-green-600">
                  {formatCurrency(Number(order.total))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phương thức thanh toán</p>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span className="font-medium">
                    {order.paymentMethod || 'Chưa xác định'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ngày đặt hàng</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(order.createdAt)}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Khách hàng</p>
                <p className="font-medium">{order.user.name}</p>
                <p className="text-sm text-gray-600">{order.user.email}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Sản phẩm đã đặt</h4>
              <div className="space-y-2">
                {order.items.map(item => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-2 border-b last:border-b-0"
                  >
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      {item.variant && (
                        <p className="text-sm text-gray-500">
                          {item.variant.name}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Số lượng: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(Number(item.price) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction Info */}
            {order.transaction && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Thông tin giao dịch</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Mã giao dịch</p>
                    <p className="font-medium">{order.transaction.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Cổng thanh toán</p>
                    <p className="font-medium">{order.transaction.provider}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Trạng thái giao dịch</p>
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-600"
                    >
                      {order.transaction.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-500">Thời gian giao dịch</p>
                    <p className="font-medium">
                      {formatDate(order.transaction.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/orders/${orderId}`}>
            <Button size="lg" className="w-full sm:w-auto">
              Xem chi tiết đơn hàng
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Tiếp tục mua sắm
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
