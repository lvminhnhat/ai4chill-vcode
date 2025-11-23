'use server'

import { prisma } from '@/lib/db'
import {
  createCheckoutFields,
  getCheckoutUrl,
  type CheckoutParams,
  type CheckoutFields,
} from '@/lib/sepay-sdk'
import { z } from 'zod'

export type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'NAPAS_BANK_TRANSFER'

const InitiatePaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CARD', 'NAPAS_BANK_TRANSFER']),
  buyerInfo: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    })
    .optional(),
})

export type InitiatePaymentInput = z.infer<typeof InitiatePaymentSchema>

export interface InitiatePaymentResult {
  success: boolean
  checkoutUrl?: string
  formFields?: CheckoutFields
  error?: string
}

/**
 * Initiate payment for an order using SePay SDK
 *
 * @param input - Payment initiation data
 * @returns Payment initiation result with checkout URL and form fields
 */
export async function initiatePayment(
  input: InitiatePaymentInput
): Promise<InitiatePaymentResult> {
  try {
    // Validate input
    const validatedInput = InitiatePaymentSchema.parse(input)
    const { orderId, paymentMethod, buyerInfo } = validatedInput

    // Fetch order by ID and validate
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true },
            },
            variant: {
              select: { id: true, name: true, duration: true },
            },
          },
        },
      },
    })

    if (!order) {
      return {
        success: false,
        error: 'Không tìm thấy đơn hàng',
      }
    }

    if (order.status !== 'PENDING') {
      return {
        success: false,
        error: 'Đơn hàng không ở trạng thái chờ thanh toán',
      }
    }

    if (!order.invoiceNumber) {
      return {
        success: false,
        error: 'Đơn hàng chưa có mã hóa đơn',
      }
    }

    // Prepare checkout parameters for SePay SDK
    const checkoutParams: CheckoutParams = {
      payment_method: paymentMethod,
      order_invoice_number: order.invoiceNumber,
      order_amount: Number(order.total),
      currency: 'VND',
      order_description: `Thanh toán đơn hàng ${order.invoiceNumber}`,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/success?orderId=${order.id}`,
      error_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/error?orderId=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/cancel?orderId=${order.id}`,
      buyer_name: buyerInfo?.name || order.user.name || undefined,
      buyer_email: buyerInfo?.email || order.user.email,
      buyer_phone: buyerInfo?.phone,
    }

    // Create checkout fields using SePay SDK
    const formFields = createCheckoutFields(checkoutParams)

    // Get checkout URL
    const checkoutUrl = getCheckoutUrl()

    return {
      success: true,
      checkoutUrl,
      formFields,
    }
  } catch (error) {
    console.error('Error initiating payment:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Lỗi xác thực: ${error.issues.map((e: any) => e.message).join(', ')}`,
      }
    }

    return {
      success: false,
      error: 'Không thể khởi tạo thanh toán. Vui lòng thử lại.',
    }
  }
}

/**
 * Get order details for payment initiation
 *
 * @param orderId - Order ID
 * @returns Order details or null if not found
 */
export async function getOrderForPaymentInitiation(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
        user: {
          select: { id: true, email: true, name: true },
        },
        orderItems: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: {
              select: { id: true, name: true },
            },
            variant: {
              select: { id: true, name: true, duration: true },
            },
          },
        },
      },
    })

    return order
  } catch (error) {
    console.error('Error fetching order for payment initiation:', error)
    return null
  }
}
