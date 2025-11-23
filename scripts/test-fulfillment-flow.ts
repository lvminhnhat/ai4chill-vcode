import { prisma } from '../src/lib/db'
import { encryptCredentials } from '../src/lib/encryption'
import { fulfillOrder } from '../src/app/actions/order-actions'

async function testFulfillmentFlow() {
  console.log('🧪 Testing Manual Fulfillment Flow...\n')

  try {
    // 1. Find a PAID order to test with
    const paidOrder = await prisma.order.findFirst({
      where: { status: 'PAID' as any },
      include: {
        user: true,
        orderItems: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    })

    if (!paidOrder) {
      console.log('❌ No PAID orders found. Creating test data first...')

      // Create test data if no paid orders exist
      const { createTestData } = await import('./create-test-data')
      await createTestData()

      // Try again
      const newPaidOrder = await prisma.order.findFirst({
        where: { status: 'PAID' as any },
        include: {
          user: true,
          orderItems: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      })

      if (!newPaidOrder) {
        console.log(
          '❌ Still no PAID orders found. Please run create-test-data.ts first.'
        )
        return
      }

      console.log('✅ Test data created. Found PAID order:', newPaidOrder.id)
      return
    }

    console.log(`📦 Found PAID order: ${paidOrder.id}`)
    console.log(`👤 Customer: ${paidOrder.user.email}`)
    console.log(`💰 Total: $${paidOrder.total}`)
    console.log(`📋 Items: ${paidOrder.orderItems.length}\n`)

    // 2. Check stock availability
    console.log('🔍 Checking stock availability...')
    for (const item of paidOrder.orderItems) {
      const availableAccounts = await prisma.account.count({
        where: {
          variantId: item.variant.id,
          isSold: false,
        },
      })

      console.log(`   ${item.product.name} - ${item.variant.name}:`)
      console.log(`     Required: ${item.quantity}`)
      console.log(`     Available: ${availableAccounts}`)
      console.log(
        `     Status: ${availableAccounts >= item.quantity ? '✅ Sufficient' : '❌ Insufficient'}\n`
      )
    }

    // 3. Test fulfillment
    console.log('🚀 Testing fulfillment process...')
    const result = await fulfillOrder(paidOrder.id)

    if (result.success) {
      console.log('✅ Fulfillment successful!')
      console.log(`📧 Message: ${result.message}`)

      // Check order status after fulfillment
      const updatedOrder = await prisma.order.findUnique({
        where: { id: paidOrder.id },
        select: { status: true },
      })

      console.log(`📊 Order status after fulfillment: ${updatedOrder?.status}`)

      // Check if accounts were marked as sold
      for (const item of paidOrder.orderItems) {
        const soldAccounts = await prisma.account.count({
          where: {
            variantId: item.variant.id,
            isSold: true,
          },
        })

        console.log(
          `🔐 Sold accounts for ${item.product.name}: ${soldAccounts}`
        )
      }
    } else {
      console.log('❌ Fulfillment failed!')
      console.log(`📧 Error: ${result.message}`)

      if (result.error) {
        console.log(`🔍 Details: ${result.error}`)
      }
    }
  } catch (error) {
    console.error('💥 Test failed with error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testFulfillmentFlow()
