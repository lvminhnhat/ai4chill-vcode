'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, QrCode, CheckCircle, Clock } from 'lucide-react'

interface PaymentQRCodeProps {
  orderId: string
  amount: number
  qrUrl: string
  onPaymentComplete?: (orderId: string) => void
}

export function PaymentQRCode({
  orderId,
  amount,
  qrUrl,
  onPaymentComplete,
}: PaymentQRCodeProps) {
  const [paymentStatus, setPaymentStatus] = useState<
    'pending' | 'checking' | 'paid' | 'error'
  >('pending')
  const [checkingCount, setCheckingCount] = useState(0)

  // Poll for payment status
  useEffect(() => {
    if (paymentStatus === 'paid' || paymentStatus === 'error') return

    const checkPaymentStatus = async () => {
      try {
        setPaymentStatus('checking')

        const response = await fetch(`/api/orders/${orderId}/status`)
        const data = await response.json()

        if (data.status === 'PAID') {
          setPaymentStatus('paid')
          onPaymentComplete?.(orderId)
        } else if (checkingCount >= 30) {
          // Stop checking after 30 attempts (5 minutes)
          setPaymentStatus('error')
        } else {
          setPaymentStatus('pending')
          setCheckingCount(prev => prev + 1)
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
        setPaymentStatus('pending')
      }
    }

    // Check every 10 seconds
    const interval = setInterval(checkPaymentStatus, 10000)

    return () => clearInterval(interval)
  }, [orderId, paymentStatus, checkingCount, onPaymentComplete])

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin" />
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <Clock className="h-5 w-5 text-red-600" />
      default:
        return <QrCode className="h-5 w-5" />
    }
  }

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'checking':
        return 'Đang kiểm tra thanh toán...'
      case 'paid':
        return 'Thanh toán thành công!'
      case 'error':
        return 'Hết thời gian chờ thanh toán'
      default:
        return 'Chờ thanh toán'
    }
  }

  const getStatusBadgeVariant = () => {
    switch (paymentStatus) {
      case 'checking':
        return 'secondary'
      case 'paid':
        return 'default'
      case 'error':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <QrCode className="h-6 w-6" />
          Thanh toán qua Sepay
        </CardTitle>
        <CardDescription>
          Quét mã QR để thanh toán đơn hàng #{orderId.slice(-8)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* QR Code Image */}
        <div className="flex justify-center">
          <div className="relative">
            <img
              src={qrUrl}
              alt="Payment QR Code"
              className="w-64 h-64 border-2 border-gray-200 rounded-lg"
              onError={e => {
                console.error('Failed to load QR code:', e)
                setPaymentStatus('error')
              }}
            />
            {paymentStatus === 'paid' && (
              <div className="absolute inset-0 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="text-center space-y-2">
          <div className="text-2xl font-bold text-primary">
            {formatAmount(amount)}
          </div>

          <Badge
            variant={getStatusBadgeVariant()}
            className="flex items-center gap-1 mx-auto w-fit"
          >
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-1">
          <p>1. Mở ứng dụng ngân hàng của bạn</p>
          <p>2. Chọn tính năng quét mã QR</p>
          <p>3. Quét mã QR bên trên</p>
          <p>4. Xác nhận thanh toán</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.open(qrUrl, '_blank')}
          >
            Mở trong tab mới
          </Button>

          {paymentStatus === 'pending' && (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setPaymentStatus('checking')}
            >
              Kiểm tra lại
            </Button>
          )}
        </div>

        {/* Help Text */}
        {paymentStatus === 'pending' && (
          <p className="text-xs text-gray-500 text-center">
            Hệ thống sẽ tự động kiểm tra trạng thái thanh toán mỗi 10 giây
          </p>
        )}

        {paymentStatus === 'error' && (
          <p className="text-xs text-red-600 text-center">
            Đã hết thời gian chờ thanh toán. Vui lòng tạo đơn hàng mới.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
