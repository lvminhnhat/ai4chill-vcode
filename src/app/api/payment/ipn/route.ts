import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateIpnSignature } from '@/lib/sepay-sdk'
import { SepayIpnPayload, SepayIpnStatus } from '@/types/sepay-ipn'

/**
 * Order status mapping from SePay IPN status
 */
const ORDER_STATUS_MAP: Record<SepayIpnStatus, string> = {
  ORDER_PAID: 'CONFIRMED',
  ORDER_FAILED: 'CANCELLED',
  ORDER_PENDING: 'PENDING',
  ORDER_PROCESSING: 'PROCESSING',
  ORDER_CANCELLED: 'CANCELLED',
}

/**
 * Transaction status mapping from SePay IPN status
 */
const TRANSACTION_STATUS_MAP: Record<SepayIpnStatus, string> = {
  ORDER_PAID: 'SUCCESS',
  ORDER_FAILED: 'FAILED',
  ORDER_PENDING: 'PENDING',
  ORDER_PROCESSING: 'PENDING',
  ORDER_CANCELLED: 'FAILED',
}

/**
 * SePay IPN Webhook Handler
 *
 * This endpoint receives Instant Payment Notifications from SePay
 * and updates order status accordingly with proper validation and idempotency.
 */
export async function POST(request: NextRequest) {
  console.log('SePay IPN webhook received')

  try {
    // Get raw body for signature validation
    const rawBody = await request.text()

    // Get signature from headers
    const signature =
      request.headers.get('x-sepay-signature') ||
      request.headers.get('signature')

    // Parse IPN payload
    let payload: SepayIpnPayload
    try {
      payload = JSON.parse(rawBody)
    } catch (error) {
      console.error('Invalid JSON payload:', error)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Log incoming IPN for debugging
    console.log('Processing IPN payload:', {
      order_invoice_number: payload.order_invoice_number,
      sepay_order_id: payload.sepay_order_id,
      status: payload.status,
      amount: payload.amount,
      payment_method: payload.payment_method,
      transaction_time: payload.transaction_time,
    })

    // Validate required payload fields
    const requiredFields = [
      'order_invoice_number',
      'sepay_order_id',
      'status',
      'amount',
      'payment_method',
      'transaction_time',
      'signature',
    ]

    for (const field of requiredFields) {
      if (!payload[field as keyof SepayIpnPayload]) {
        console.error(`Missing required field: ${field}`)
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate IPN signature first (security check)
    if (!validateIpnSignature(payload, signature || undefined)) {
      console.error('Invalid IPN signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Find order by invoice number
    const order = await prisma.order.findUnique({
      where: { invoiceNumber: payload.order_invoice_number },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        orderItems: {
          include: {
            product: { select: { name: true } },
            variant: { select: { name: true } },
          },
        },
      },
    })

    if (!order) {
      console.error(
        `Order with invoice ${payload.order_invoice_number} not found`
      )
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Validate payment amount matches order total
    const orderTotal = Number(order.total)
    const paymentAmount = payload.amount

    if (Math.abs(orderTotal - paymentAmount) > 100) {
      // Allow small difference (100 VND)
      console.error(
        `Amount mismatch for order ${payload.order_invoice_number}: expected ${orderTotal}, got ${paymentAmount}`
      )
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // Generate unique transaction reference for idempotency
    const transactionReference = `IPN-${payload.sepay_order_id}-${payload.transaction_time}`

    // Check if transaction already processed (idempotency)
    const existingTransaction = await prisma.transaction.findFirst({
      where: { reference: transactionReference },
    })

    if (existingTransaction) {
      console.log(`Transaction ${transactionReference} already processed`)
      return NextResponse.json({
        message: 'Transaction already processed',
        transactionId: existingTransaction.id,
      })
    }

    // Map SePay status to our order status
    const newOrderStatus =
      ORDER_STATUS_MAP[payload.status as SepayIpnStatus] || order.status
    const newTransactionStatus =
      TRANSACTION_STATUS_MAP[payload.status as SepayIpnStatus] || 'PENDING'

    // Process payment in a transaction
    const result = await prisma.$transaction(async tx => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: newOrderStatus as any,
          paymentMethod: payload.payment_method,
        },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      })

      // Create or update transaction record
      const transaction = await tx.transaction.create({
        data: {
          orderId: order.id,
          amount: paymentAmount,
          status: newTransactionStatus,
          provider: 'SEPAY',
          sepayOrderId: payload.sepay_order_id,
          paymentMethod: payload.payment_method,
          gatewayData: payload as any,
          reference: transactionReference,
        },
      })

      return {
        order: updatedOrder,
        transaction,
      }
    })

    console.log(
      `Successfully processed IPN for order ${payload.order_invoice_number}`,
      {
        transactionId: result.transaction.id,
        sepayOrderId: payload.sepay_order_id,
        amount: paymentAmount,
        status: newOrderStatus,
      }
    )

    // TODO: Send confirmation email for successful payments
    // TODO: Update user statistics if needed
    // TODO: Trigger fulfillment process for confirmed orders

    return NextResponse.json({
      success: true,
      orderId: order.id,
      invoiceNumber: payload.order_invoice_number,
      transactionId: result.transaction.id,
      sepayOrderId: payload.sepay_order_id,
      status: newOrderStatus,
    })
  } catch (error) {
    console.error('Error processing SePay IPN:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for IPN webhook verification/testing
 */
export async function GET() {
  return NextResponse.json({
    message: 'SePay IPN webhook endpoint is active',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    supported_statuses: Object.keys(ORDER_STATUS_MAP),
  })
}
