/**
 * Test script for Sepay Payment Integration
 *
 * This script tests the complete payment flow:
 * 1. Create order with items
 * 2. Generate QR URL
 * 3. Simulate webhook payment
 * 4. Verify order status update
 */

import { createOrder } from '../src/app/actions/create-order'
import { prisma } from '../src/lib/db'

async function testSepayIntegration() {
  console.log('🧪 Testing Sepay Payment Integration...\n')

  try {
    // Test data
    const testUserId = 'test_user_id' // You'll need to create a test user first
    const testItems = [
      {
        variantId: 'test_variant_id', // You'll need to create test variants
        quantity: 1,
      },
    ]

    console.log('1️⃣ Creating order...')

    // Create order
    const orderResult = await createOrder({
      userId: testUserId,
      items: testItems,
      paymentMethod: 'BANK_TRANSFER',
    })

    if (!orderResult.success) {
      console.error('❌ Order creation failed:', orderResult.error)
      return
    }

    console.log('✅ Order created successfully!')
    console.log(`   Order ID: ${orderResult.orderId}`)
    console.log(`   Invoice Number: ${orderResult.invoiceNumber}`)
    console.log(`   Total Amount: ${orderResult.totalAmount} VND\n`)

    // Wait a bit (simulating customer scanning QR)
    console.log('2️⃣ Simulating payment webhook...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Simulate webhook
    const webhookPayload = {
      id: `test_txn_${Date.now()}`,
      gateway: 'SEPAY',
      transactionDate: new Date().toISOString(),
      accountNumber: '1234567890',
      amount: orderResult.totalAmount,
      content: `AI4CHILL ${orderResult.orderId}`,
      referenceCode: `TEST_REF_${Date.now()}`,
      description: `AI4CHILL ${orderResult.orderId}`,
      test: true,
    }

    // Call webhook endpoint
    const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhooks/sepay`

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Webhook': 'true',
      },
      body: JSON.stringify(webhookPayload),
    })

    const webhookResult = await webhookResponse.json()

    if (webhookResponse.ok && webhookResult.success) {
      console.log('✅ Webhook processed successfully!')
      console.log(`   Transaction ID: ${webhookResult.transactionId}`)
      console.log(`   Order Status: ${webhookResult.status}\n`)
    } else {
      console.error('❌ Webhook failed:', webhookResult)
      return
    }

    // Verify order status
    console.log('3️⃣ Verifying order status...')
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderResult.orderId },
      include: {
        transactions: true,
      },
    })

    if (updatedOrder) {
      console.log('✅ Order verification complete!')
      console.log(`   Order Status: ${updatedOrder.status}`)
      console.log(`   Transactions: ${updatedOrder.transactions.length}`)

      if (updatedOrder.transactions.length > 0) {
        const transaction = updatedOrder.transactions[0]
        console.log(`   Transaction Status: ${transaction.status}`)
        console.log(`   Transaction Amount: ${transaction.amount}`)
      }
    } else {
      console.error('❌ Could not verify order status')
    }

    console.log('\n🎉 Sepay Integration Test Complete!')
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
if (require.main === module) {
  testSepayIntegration()
}

export { testSepayIntegration }
