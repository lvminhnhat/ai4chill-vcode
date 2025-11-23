'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Info,
  Clock,
  Package,
  CreditCard,
  ShoppingCart,
  RefreshCw,
} from 'lucide-react'
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

export default function PaymentCancelPage() {
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orderId = searchParams.get('orderId')

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

  const handleResumePayment = () => {
    if (orderId) {
      // Redirect to checkout page with order ID to resume payment
      window.location.href = `/checkout?orderId=${orderId}`
    } else {
      window.location.href = '/checkout'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Cancel Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Info className="w-10 h-10 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-yellow-600 mb-2">
            Thanh toán đã bị hủy
          </h1>
          <p className="text-gray-600">
            Bạn đã hủy quá trình thanh toán. Đơn hàng vẫn được lưu và bạn có thể
            tiếp tục thanh toán sau.
          </p>
        </div>

        {/* Order Details (if available) */}
        {order && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Thông tin đơn hàng
              </CardTitle>
              <CardDescription>
                Đơn hàng của bạn đang chờ thanh toán
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
                  <Badge
                    variant="outline"
                    className="text-yellow-600 border-yellow-600"
                  >
                    {order.status === 'PENDING'
                      ? 'Chờ thanh toán'
                      : order.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tổng tiền</p>
                  <p className="font-semibold text-lg text-yellow-600">
                    {formatCurrency(Number(order.total))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Phương thức thanh toán
                  </p>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-medium">
                      {order.paymentMethod || 'Chưa chọn'}
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
            </CardContent>
          </Card>
        )}

        {/* Cancellation Info */}
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-600">
              Thông tin hủy thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">
                    Đơn hàng vẫn được lưu
                  </p>
                  <p className="text-gray-600">
                    Đơn hàng của bạn vẫn được lưu trong hệ thống và bạn có thể
                    tiếp tục thanh toán bất cứ lúc nào.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">
                    Thời gian giữ hàng
                  </p>
                  <p className="text-gray-600">
                    Đơn hàng sẽ được giữ trong 24 giờ. Sau thời gian này, đơn
                    hàng có thể bị hủy tự động.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <RefreshCw className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">
                    Tiếp tục thanh toán
                  </p>
                  <p className="text-gray-600">
                    Bạn có thể nhấn nút "Tiếp tục thanh toán" để quay lại trang
                    thanh toán và hoàn tất đơn hàng.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleResumePayment}
            size="lg"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tiếp tục thanh toán
          </Button>

          <Link href="/cart">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Về giỏ hàng
            </Button>
          </Link>
        </div>

        {/* Additional Options */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Các lựa chọn khác</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/orders" className="block">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <Package className="w-6 h-6 text-blue-600 mb-2" />
                    <h4 className="font-medium mb-1">Xem các đơn hàng khác</h4>
                    <p className="text-sm text-gray-600">
                      Quản lý và theo dõi các đơn hàng của bạn
                    </p>
                  </div>
                </Link>

                <Link href="/support" className="block">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <Info className="w-6 h-6 text-green-600 mb-2" />
                    <h4 className="font-medium mb-1">Cần trợ giúp?</h4>
                    <p className="text-sm text-gray-600">
                      Liên hệ đội ngũ hỗ trợ của chúng tôi
                    </p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-2">
            Cần thêm trợ giúp? Liên hệ chúng tôi:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <Link
              href="mailto:support@yourstore.com"
              className="text-blue-600 hover:underline"
            >
              support@yourstore.com
            </Link>
            <span className="text-gray-400">•</span>
            <Link href="tel:19001234" className="text-blue-600 hover:underline">
              Hotline: 1900 1234
            </Link>
            <span className="text-gray-400">•</span>
            <Link href="/faq" className="text-blue-600 hover:underline">
              Câu hỏi thường gặp
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
