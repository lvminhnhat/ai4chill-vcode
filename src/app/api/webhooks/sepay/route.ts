import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  validateWebhookSignature,
  validateWebhookPayload,
  extractOrderIdFromDescription,
  generateTransactionReference,
  isAllowedIP,
} from '@/lib/sepay'

/**
 * Sepay Webhook Handler
 *
 * This endpoint receives payment notifications from Sepay
 * and updates order status accordingly.
 */
export async function POST(request: NextRequest) {
  console.log('Sepay webhook received')

  try {
    // Get client IP for security validation
    const forwarded = request.headers.get('x-forwarded-for')
    const clientIP = forwarded ? forwarded.split(',')[0] : 'unknown'

    console.log(`Webhook from IP: ${clientIP}`)

    // Check if this is a test webhook (bypass IP validation)
    const isTestWebhook = request.headers.get('x-test-webhook') === 'true'

    // Validate IP whitelist (if configured and not a test)
    if (!isTestWebhook && !isAllowedIP(clientIP)) {
      console.warn(`Unauthorized IP attempt: ${clientIP}`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get raw body for signature validation
    const rawBody = await request.text()

    // Get signature from headers (if Sepay provides one)
    const signature =
      request.headers.get('x-sepay-signature') ||
      request.headers.get('signature')

    // Validate webhook signature (if available)
    if (signature && !validateWebhookSignature(rawBody, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse webhook payload
    let payload
    try {
      payload = JSON.parse(rawBody)
    } catch (error) {
      console.error('Invalid JSON payload:', error)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Validate payload structure
    if (!validateWebhookPayload(payload)) {
      console.error('Invalid webhook payload structure:', payload)
      return NextResponse.json(
        { error: 'Invalid payload structure' },
        { status: 400 }
      )
    }

    console.log('Processing webhook payload:', {
      id: payload.id,
      amount: payload.amount,
      description: payload.description,
      referenceCode: payload.referenceCode,
    })

    // Extract order ID from description
    const orderId = extractOrderIdFromDescription(payload.description)
    if (!orderId) {
      console.error(
        'Could not extract order ID from description:',
        payload.description
      )
      return NextResponse.json(
        { error: 'Invalid order description' },
        { status: 400 }
      )
    }

    // Generate unique transaction reference for idempotency
    const transactionReference = generateTransactionReference(payload)

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

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
      console.error(`Order ${orderId} not found`)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Validate order status (should be PENDING)
    if (order.status !== 'PENDING') {
      console.warn(
        `Order ${orderId} is not pending (current status: ${order.status})`
      )
      return NextResponse.json(
        { error: 'Order cannot be paid' },
        { status: 400 }
      )
    }

    // Validate payment amount matches order total
    const orderTotal = Number(order.total)
    const paymentAmount = payload.amount

    if (Math.abs(orderTotal - paymentAmount) > 100) {
      // Allow small difference (100 VND)
      console.error(
        `Amount mismatch for order ${orderId}: expected ${orderTotal}, got ${paymentAmount}`
      )
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // Process payment in a transaction
    const result = await prisma.$transaction(async tx => {
      // Update order status to PAID
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      })

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          orderId,
          amount: paymentAmount,
          status: 'SUCCESS',
          provider: 'SEPAY',
          gatewayData: payload,
          reference: transactionReference,
        },
      })

      return {
        order: updatedOrder,
        transaction,
      }
    })

    console.log(`Successfully processed payment for order ${orderId}`, {
      transactionId: result.transaction.id,
      amount: paymentAmount,
    })

    // TODO: Send confirmation email (task #9)
    // TODO: Update user statistics if needed

    return NextResponse.json({
      success: true,
      orderId,
      transactionId: result.transaction.id,
      status: 'PAID',
    })
  } catch (error) {
    console.error('Error processing Sepay webhook:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for webhook verification/testing
 */
export async function GET() {
  return NextResponse.json({
    message: 'Sepay webhook endpoint is active',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
}
