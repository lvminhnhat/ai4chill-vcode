import { prisma } from '../src/lib/db'
import { encryptCredentials } from '../src/lib/encryption'

async function createFulfillmentTestData() {
  console.log('🔧 Creating test data for fulfillment flow...\n')

  try {
    // 1. Find or create a test user
    let testUser = await prisma.user.findFirst({
      where: { email: 'test.customer@example.com' },
    })

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test.customer@example.com',
          name: 'Test Customer',
          role: 'USER',
        },
      })
      console.log('✅ Created test user:', testUser.email)
    } else {
      console.log('✅ Found existing test user:', testUser.email)
    }

    // 2. Find existing products and variants
    const products = await prisma.product.findMany({
      include: {
        variants: true,
      },
    })

    if (products.length === 0) {
      console.log('❌ No products found. Please run create-test-data.ts first.')
      return
    }

    console.log(`✅ Found ${products.length} products`)

    // 3. Create test accounts for each variant
    for (const product of products) {
      for (const variant of product.variants) {
        // Check if accounts already exist
        const existingAccounts = await prisma.account.count({
          where: { variantId: variant.id },
        })

        if (existingAccounts === 0) {
          // Create 5 test accounts per variant
          const accounts = []
          for (let i = 1; i <= 5; i++) {
            const credentials = encryptCredentials({
              email: `${variant.name.toLowerCase().replace(/\s+/g, '_')}${i}@test.com`,
              password: `TestPassword${i}!`,
            })

            accounts.push({
              variantId: variant.id,
              credentials,
            })
          }

          await prisma.account.createMany({
            data: accounts,
          })

          console.log(
            `✅ Created 5 test accounts for ${product.name} - ${variant.name}`
          )
        } else {
          const availableAccounts = await prisma.account.count({
            where: {
              variantId: variant.id,
              isSold: false,
            },
          })
          console.log(
            `✅ Found ${existingAccounts} accounts for ${product.name} - ${variant.name} (${availableAccounts} available)`
          )
        }
      }
    }

    // 4. Create a PAID test order if none exists
    const existingPaidOrder = await prisma.order.findFirst({
      where: { status: 'PAID' as any },
    })

    if (!existingPaidOrder) {
      // Select first 2 variants for the test order
      const firstProduct = products[0]
      const selectedVariants = firstProduct.variants.slice(0, 2)

      const orderItems = selectedVariants.map(variant => ({
        productId: variant.productId,
        variantId: variant.id,
        quantity: 1,
        price: variant.price,
      }))

      const totalAmount = orderItems.reduce(
        (sum, item) => sum + Number(item.price),
        0
      )

      const testOrder = await prisma.order.create({
        data: {
          userId: testUser.id,
          total: totalAmount,
          status: 'PAID' as any,
          invoiceNumber: `FULFILL-INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          paymentMethod: 'BANK_TRANSFER',
          orderItems: {
            create: orderItems,
          },
        },
        include: {
          orderItems: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      })

      console.log(`✅ Created PAID test order: ${testOrder.id}`)
      console.log(`💰 Total: $${testOrder.total}`)
      console.log(`📋 Items: ${testOrder.orderItems.length}`)

      testOrder.orderItems.forEach((item, index) => {
        console.log(
          `   ${index + 1}. ${item.product.name} - ${item.variant.name}: $${item.price}`
        )
      })
    } else {
      console.log(`✅ Found existing PAID order: ${existingPaidOrder.id}`)
    }

    console.log('\n🎉 Test data creation completed!')
    console.log('You can now test the fulfillment flow:')
    console.log('1. Go to /admin/orders')
    console.log('2. Click on a PAID order')
    console.log('3. Click "Fulfill Order" button')
    console.log('4. Check email delivery (check Resend dashboard)')
  } catch (error) {
    console.error('💥 Failed to create test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createFulfillmentTestData()
