'use client'

import { useState, useEffect, FormEvent } from 'react'
import {
  getCheckoutUrl,
  createCheckoutFields,
  generateInvoiceNumber,
  PaymentMethod,
} from '@/lib/sepay-sdk'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Props interface
export interface SepayCheckoutFormProps {
  orderId: string
  amount: number
  description: string
  paymentMethod: PaymentMethod
  buyerInfo?: {
    name?: string
    email?: string
    phone?: string
  }
  onSuccess?: () => void
  onError?: (error: Error) => void
  autoSubmit?: boolean // Default: false
}

// Component state interface
interface CheckoutState {
  invoiceNumber: string
  checkoutUrl: string
  checkoutFields: any
  isLoading: boolean
  error: string | null
  isSubmitting: boolean
}

// Payment method labels
const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  CARD: 'Thẻ tín dụng/Ghi nợ',
  NAPAS_BANK_TRANSFER: 'Chuyển khoản NAPAS',
}

// Payment method colors
const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'bg-blue-100 text-blue-800',
  CARD: 'bg-green-100 text-green-800',
  NAPAS_BANK_TRANSFER: 'bg-purple-100 text-purple-800',
}

export default function SepayCheckoutForm({
  orderId,
  amount,
  description,
  paymentMethod,
  buyerInfo,
  onSuccess,
  onError,
  autoSubmit = false,
}: SepayCheckoutFormProps) {
  const [state, setState] = useState<CheckoutState>({
    invoiceNumber: '',
    checkoutUrl: '',
    checkoutFields: null,
    isLoading: true,
    error: null,
    isSubmitting: false,
  })

  // Generate callback URLs
  const getCallbackUrls = () => {
    const baseUrl = process.env.NEXTAUTH_URL || window.location.origin

    return {
      successUrl: `${baseUrl}${process.env.NEXT_PUBLIC_SUCCESS_URL || '/payment/success'}?orderId=${orderId}`,
      errorUrl: `${baseUrl}${process.env.NEXT_PUBLIC_ERROR_URL || '/payment/error'}?orderId=${orderId}`,
      cancelUrl: `${baseUrl}${process.env.NEXT_PUBLIC_CANCEL_URL || '/payment/cancel'}?orderId=${orderId}`,
    }
  }

  // Initialize checkout
  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }))

        // Generate invoice number
        const invoiceNumber = generateInvoiceNumber({
          prefix: 'INV',
          separator: '-',
        })

        // Get checkout URL
        const checkoutUrl = getCheckoutUrl()

        // Get callback URLs
        const { successUrl, errorUrl, cancelUrl } = getCallbackUrls()

        // Create checkout fields
        const checkoutFields = createCheckoutFields({
          payment_method: paymentMethod,
          order_invoice_number: invoiceNumber,
          order_amount: amount,
          currency: 'VND',
          order_description: description,
          success_url: successUrl,
          error_url: errorUrl,
          cancel_url: cancelUrl,
          buyer_name: buyerInfo?.name,
          buyer_email: buyerInfo?.email,
          buyer_phone: buyerInfo?.phone,
        })

        setState(prev => ({
          ...prev,
          invoiceNumber,
          checkoutUrl,
          checkoutFields,
          isLoading: false,
        }))

        // Auto-submit if enabled
        if (autoSubmit && checkoutFields) {
          setTimeout(() => {
            const form = document.getElementById(
              'sepay-checkout-form'
            ) as HTMLFormElement
            if (form) {
              form.requestSubmit()
            }
          }, 1000)
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred'
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }))

        onError?.(error instanceof Error ? error : new Error(errorMessage))
      }
    }

    initializeCheckout()
  }, [
    orderId,
    amount,
    description,
    paymentMethod,
    buyerInfo,
    autoSubmit,
    onError,
  ])

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!state.checkoutUrl || !state.checkoutFields) {
      const error = new Error('Checkout not ready')
      setState(prev => ({ ...prev, error: error.message }))
      onError?.(error)
      return
    }

    try {
      setState(prev => ({ ...prev, isSubmitting: true }))

      // Create and submit form
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = state.checkoutUrl

      // Add all checkout fields as hidden inputs
      Object.entries(state.checkoutFields).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = String(value)
        form.appendChild(input)
      })

      document.body.appendChild(form)
      form.submit()

      onSuccess?.()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to submit payment'
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: errorMessage,
      }))

      onError?.(error instanceof Error ? error : new Error(errorMessage))
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  if (state.isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">
              Đang chuẩn bị thanh toán...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (state.error) {
    return (
      <Card className="w-full max-w-md mx-auto border-destructive">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-destructive text-4xl mb-2">⚠️</div>
              <h3 className="text-lg font-semibold text-destructive">
                Lỗi thanh toán
              </h3>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {state.error}
            </p>
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Thử lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Thanh toán SePay</CardTitle>
        <CardDescription className="text-center">
          Hoàn tất thanh toán cho đơn hàng #{orderId}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Mã đơn hàng:</span>
            <span className="font-mono text-sm">{orderId}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Mã hóa đơn:</span>
            <span className="font-mono text-sm">{state.invoiceNumber}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Số tiền:</span>
            <span className="font-semibold text-lg">
              {formatCurrency(amount)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Mô tả:</span>
            <span className="text-sm text-right max-w-[200px]">
              {description}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Phương thức:</span>
            <Badge className={PAYMENT_METHOD_COLORS[paymentMethod]}>
              {PAYMENT_METHOD_LABELS[paymentMethod]}
            </Badge>
          </div>
        </div>

        {/* Buyer Info */}
        {buyerInfo && Object.values(buyerInfo).some(value => value) && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Thông tin người mua</h4>
            <div className="space-y-2">
              {buyerInfo.name && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Họ tên:</span>
                  <span className="text-sm">{buyerInfo.name}</span>
                </div>
              )}
              {buyerInfo.email && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm">{buyerInfo.email}</span>
                </div>
              )}
              {buyerInfo.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Điện thoại:
                  </span>
                  <span className="text-sm">{buyerInfo.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Form */}
        <form
          id="sepay-checkout-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Hidden fields for checkout */}
          {state.checkoutFields &&
            Object.entries(state.checkoutFields).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={String(value)} />
            ))}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={state.isSubmitting}
            size="lg"
          >
            {state.isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang xử lý...
              </>
            ) : (
              `Thanh toán ${formatCurrency(amount)}`
            )}
          </Button>
        </form>

        {/* Security Note */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            🔒 Giao dịch được bảo mật bởi SePay
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
