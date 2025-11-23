/**
 * Create test data for Sepay Payment Integration testing
 *
 * This script creates:
 * 1. Test user
 * 2. Test product with variants
 * 3. Stock for variants
 */

import { prisma } from '../src/lib/db'
import { hash } from 'bcryptjs'

async function createTestData() {
  console.log('🔧 Creating test data for Sepay Integration...\n')

  try {
    // 1. Create test user
    console.log('1️⃣ Creating test user...')

    const hashedPassword = await hash('testpassword123', 12)

    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: 'USER',
      },
    })

    console.log('✅ Test user created/updated!')
    console.log(`   User ID: ${testUser.id}`)
    console.log(`   Email: ${testUser.email}\n`)

    // 2. Create test product
    console.log('2️⃣ Creating test product...')

    let testProduct = await prisma.product.findFirst({
      where: { name: 'ChatGPT Plus Subscription' },
    })

    if (!testProduct) {
      testProduct = await prisma.product.create({
        data: {
          name: 'ChatGPT Plus Subscription',
          description: 'Monthly subscription to ChatGPT Plus with all features',
          price: 99000, // 99,000 VND
        },
      })
    }

    console.log('✅ Test product created/updated!')
    console.log(`   Product ID: ${testProduct.id}`)
    console.log(`   Name: ${testProduct.name}`)
    console.log(`   Price: ${testProduct.price} VND\n`)

    // 3. Create test variants
    console.log('3️⃣ Creating test variants...')

    const variants = [
      {
        name: '1 Month',
        duration: '30 days',
        price: 99000,
        stock: 100,
      },
      {
        name: '3 Months',
        duration: '90 days',
        price: 267000, // 10% discount
        stock: 50,
      },
      {
        name: '6 Months',
        duration: '180 days',
        price: 534000, // 10% discount
        stock: 25,
      },
    ]

    const createdVariants = []

    for (const variantData of variants) {
      let variant = await prisma.variant.findFirst({
        where: {
          productId: testProduct.id,
          name: variantData.name,
        },
      })

      if (!variant) {
        variant = await prisma.variant.create({
          data: {
            productId: testProduct.id,
            name: variantData.name,
            duration: variantData.duration,
            price: variantData.price,
            stock: variantData.stock,
          },
        })
      }

      createdVariants.push(variant)
      console.log(
        `   ✅ ${variant.name}: ${variant.price} VND (${variant.stock} in stock)`
      )
    }

    console.log('\n🎉 Test data creation complete!')
    console.log('\n📋 Summary:')
    console.log(`   User ID: ${testUser.id}`)
    console.log(`   Product ID: ${testProduct.id}`)
    console.log('   Variant IDs:')
    createdVariants.forEach((variant, index) => {
      console.log(`     ${index + 1}. ${variant.name}: ${variant.id}`)
    })

    console.log('\n🧪 You can now test the payment flow with:')
    console.log(`   User ID: ${testUser.id}`)
    console.log(`   Variant ID: ${createdVariants[0].id} (1 Month)`)
  } catch (error) {
    console.error('❌ Failed to create test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  createTestData()
}

export { createTestData }
