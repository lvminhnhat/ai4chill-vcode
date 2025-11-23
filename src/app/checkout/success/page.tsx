import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatCurrency } from '@/lib/format'
import { getMockOrder } from '@/app/actions/order-actions'

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string }
}) {
  const orderId = searchParams.orderId

  if (!orderId) {
    notFound()
  }

  // Try to fetch from mock orders first (MVP)
  let order: any = getMockOrder(orderId)

  // If not found in mock, try database
  if (!order) {
    try {
      const dbOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      })

      if (dbOrder) {
        order = {
          id: dbOrder.id,
          total: Number(dbOrder.total),
          status: dbOrder.status,
          createdAt: dbOrder.createdAt,
          orderItems: dbOrder.orderItems,
          customerEmail: '',
          customerName: '',
        }
      }
    } catch {
      // If DB fails, create a basic mock order
      order = {
        id: orderId,
        total: 0,
        status: 'PENDING',
        createdAt: new Date(),
        orderItems: [],
        customerEmail: '',
        customerName: '',
      }
    }
  }

  if (!order) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Đặt hàng thành công!</h1>
        <p className="text-muted-foreground mb-8">
          Cảm ơn bạn đã đặt hàng. Chúng tôi đã nhận được đơn hàng của bạn.
        </p>

        <Card className="text-left mb-8">
          <CardHeader>
            <CardTitle>Thông tin đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mã đơn hàng:</span>
              <span className="font-mono">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tổng tiền:</span>
              <span className="font-bold">{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trạng thái:</span>
              <Badge
                variant={order.status === 'PENDING' ? 'secondary' : 'default'}
              >
                {order.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ngày đặt:</span>
              <span>
                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>

            {order.orderItems && order.orderItems.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Sản phẩm đã đặt:</h4>
                <div className="space-y-2">
                  {order.orderItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.product?.name || 'Sản phẩm'}
                        {item.variant?.name && ` (${item.variant.name})`} x
                        {item.quantity}
                      </span>
                      <span>{formatCurrency(Number(item.price))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Chúng tôi sẽ gửi email xác nhận đến địa chỉ email của bạn khi đơn
            hàng được xử lý.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Lưu ý:</strong> Tính năng thanh toán sẽ được bổ sung trong
            phiên bản tiếp theo. Đơn hàng của bạn hiện đang ở trạng thái chờ xử
            lý.
          </p>
        </div>

        <div className="flex gap-4 justify-center mt-8">
          <Button asChild>
            <Link href="/products">Tiếp tục mua sắm</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Xem đơn hàng</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
