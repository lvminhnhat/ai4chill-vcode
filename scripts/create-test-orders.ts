import { prisma } from '@/lib/db'
import { OrderStatus } from '@/generated/prisma'

async function createTestOrders() {
  try {
    // Get existing users, products, and variants
    const users = await prisma.user.findMany({ take: 3 })
    const products = await prisma.product.findMany({ take: 5 })

    if (users.length === 0 || products.length === 0) {
      console.log('❌ Need at least 1 user and 1 product to create test orders')
      return
    }

    // Get variants for products
    const variants = await prisma.variant.findMany({
      where: {
        productId: {
          in: products.map(p => p.id),
        },
      },
      take: 10,
    })

    if (variants.length === 0) {
      console.log('❌ Need at least 1 variant to create test orders')
      return
    }

    // Create test orders with different statuses
    const testOrders = [
      {
        userId: users[0].id,
        total: 29.99,
        status: 'PENDING' as OrderStatus,
        orderItems: [
          {
            productId: variants[0].productId,
            variantId: variants[0].id,
            quantity: 1,
            price: 29.99,
          },
        ],
      },
      {
        userId: users[1].id,
        total: 89.98,
        status: 'PROCESSING' as OrderStatus,
        orderItems: [
          {
            productId: variants[1].productId,
            variantId: variants[1].id,
            quantity: 2,
            price: 44.99,
          },
        ],
      },
      {
        userId: users[0].id,
        total: 159.97,
        status: 'SHIPPED' as OrderStatus,
        orderItems: [
          {
            productId: variants[2].productId,
            variantId: variants[2].id,
            quantity: 1,
            price: 99.99,
          },
          {
            productId: variants[3].productId,
            variantId: variants[3].id,
            quantity: 1,
            price: 59.98,
          },
        ],
      },
      {
        userId: users[2].id,
        total: 199.99,
        status: 'DELIVERED' as OrderStatus,
        orderItems: [
          {
            productId: variants[4].productId,
            variantId: variants[4].id,
            quantity: 1,
            price: 199.99,
          },
        ],
      },
      {
        userId: users[1].id,
        total: 49.99,
        status: 'CANCELLED' as OrderStatus,
        orderItems: [
          {
            productId: variants[5].productId,
            variantId: variants[5].id,
            quantity: 1,
            price: 49.99,
          },
        ],
      },
    ]

    // Create orders
    for (const orderData of testOrders) {
      const order = await prisma.order.create({
        data: {
          userId: orderData.userId,
          total: orderData.total,
          status: orderData.status,
          orderItems: {
            create: orderData.orderItems,
          },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
              variant: {
                select: {
                  name: true,
                  duration: true,
                },
              },
            },
          },
        },
      })

      console.log(
        `✅ Created ${order.status} order for ${order.user.email}: $${order.total}`
      )
    }

    console.log('\n🎉 Test orders created successfully!')
  } catch (error) {
    console.error('❌ Error creating test orders:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  createTestOrders()
}

export { createTestOrders }
