'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  XCircle,
  AlertTriangle,
  RefreshCw,
  MessageCircle,
  ShoppingCart,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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

export default function PaymentErrorContent() {
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)

  const orderId = searchParams.get('orderId')
  const errorMessage =
    searchParams.get('error') || 'Đã xảy ra lỗi trong quá trình thanh toán'

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId)
    } else {
      setLoading(false)
    }
  }, [orderId])

  const fetchOrderDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`)

      if (!response.ok) {
        throw new Error('Không thể tải thông tin đơn hàng')
      }

      const data = await response.json()
      setOrder(data)
    } catch (err) {
      // Error is handled by the loading state
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

  const handleRetryPayment = () => {
    if (orderId) {
      // Redirect to checkout page with order ID
      window.location.href = `/checkout?orderId=${orderId}`
    } else {
      window.location.href = '/checkout'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Error Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">
            Thanh toán thất bại
          </h1>
          <p className="text-gray-600">
            Rất tiếc, đã xảy ra lỗi trong quá trình thanh toán.
          </p>
        </div>

        {/* Error Alert */}
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Lỗi thanh toán</AlertTitle>
          <AlertDescription className="text-red-700">
            {decodeURIComponent(errorMessage)}
          </AlertDescription>
        </Alert>

        {/* Order Details (if available) */}
        {order && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Thông tin đơn hàng
              </CardTitle>
              <CardDescription>
                Đơn hàng của bạn vẫn được lưu nhưng chưa được thanh toán
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Mã đơn hàng</p>
                  <p className="font-medium">{order.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trạng thái</p>
                  <Badge variant="destructive">
                    {order.status === 'PENDING'
                      ? 'Chờ thanh toán'
                      : order.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tổng tiền</p>
                  <p className="font-semibold text-lg text-red-600">
                    {formatCurrency(Number(order.total))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ngày đặt hàng</p>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Sản phẩm trong đơn hàng</h4>
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

              {/* Transaction Info (if available) */}
              {order.transaction && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 text-red-600">
                    Thông tin giao dịch thất bại
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Mã giao dịch</p>
                      <p className="font-medium">{order.transaction.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Cổng thanh toán</p>
                      <p className="font-medium">
                        {order.transaction.provider}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Trạng thái giao dịch</p>
                      <Badge variant="destructive">
                        {order.transaction.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-500">Thời gian</p>
                      <p className="font-medium">
                        {formatDate(order.transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error Details */}
        <Card className="mb-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">
              Nguyên nhân có thể xảy ra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>
                  Kết nối mạng không ổn định trong quá trình thanh toán
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>
                  Tài khoản ngân hàng hoặc thẻ tín dụng không đủ số dư
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Thông tin thanh toán không chính xác</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Giao dịch bị hủy bởi ngân hàng hoặc cổng thanh toán</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>Phiên giao dịch đã hết hạn</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleRetryPayment}
            size="lg"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Thử lại thanh toán
          </Button>

          <Link href="mailto:support@yourstore.com?subject=Vấn đề thanh toán đơn hàng">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <MessageCircle className="w-4 h-4 mr-2" />
              Liên hệ hỗ trợ
            </Button>
          </Link>

          <Link href="/cart">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Về giỏ hàng
            </Button>
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-2">Cần thêm trợ giúp?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <Link href="/support" className="text-blue-600 hover:underline">
              Trung tâm hỗ trợ
            </Link>
            <span className="text-gray-400">•</span>
            <Link href="/faq" className="text-blue-600 hover:underline">
              Câu hỏi thường gặp
            </Link>
            <span className="text-gray-400">•</span>
            <Link href="tel:19001234" className="text-blue-600 hover:underline">
              Hotline: 1900 1234
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
