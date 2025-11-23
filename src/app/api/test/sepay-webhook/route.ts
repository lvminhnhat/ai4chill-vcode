import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Test endpoint to simulate Sepay webhook
 *
 * This endpoint is for development/testing only.
 * It simulates a Sepay webhook payload for testing the payment flow.
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId, amount, status = 'SUCCESS' } = await request.json()

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: 'orderId and amount are required' },
        { status: 400 }
      )
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Simulate Sepay webhook payload
    const mockPayload = {
      id: `test_txn_${Date.now()}`,
      gateway: 'SEPAY',
      transactionDate: new Date().toISOString(),
      accountNumber: '1234567890',
      amount: Number(amount),
      content: `AI4CHILL ${orderId}`,
      referenceCode: `TEST_REF_${Date.now()}`,
      description: `AI4CHILL ${orderId}`,
      test: true, // Mark as test payload
    }

    // Call the actual webhook handler logic
    const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhooks/sepay`

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Webhook': 'true', // Bypass IP validation for tests
      },
      body: JSON.stringify(mockPayload),
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Test webhook sent',
      payload: mockPayload,
      webhookResponse: result,
    })
  } catch (error) {
    console.error('Error sending test webhook:', error)
    return NextResponse.json(
      { error: 'Failed to send test webhook' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to get test webhook payload format
 */
export async function GET() {
  return NextResponse.json({
    message: 'Sepay Test Webhook Helper',
    usage: {
      endpoint: 'POST /api/test/sepay-webhook',
      body: {
        orderId: 'your_order_id',
        amount: 99000,
        status: 'SUCCESS', // optional
      },
    },
    examplePayload: {
      id: 'test_txn_1234567890',
      gateway: 'SEPAY',
      transactionDate: '2025-01-20T10:30:00Z',
      accountNumber: '1234567890',
      amount: 99000,
      content: 'AI4CHILL ord_abc123',
      referenceCode: 'TEST_REF_123456',
      description: 'AI4CHILL ord_abc123',
    },
  })
}
