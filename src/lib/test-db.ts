import { prisma } from './db'

async function testDatabaseConnection() {
  try {
    // Test basic connection
    await prisma.$connect()
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Database connection successful')
    }

    // Test creating a user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword123',
      },
    })
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Created user:', user.id)
    }

    // Test creating a product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'A test product',
        price: 29.99,
      },
    })
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Created product:', product.id)
    }

    // Test creating a variant
    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        name: 'Large',
        price: 29.99,
        stock: 100,
      },
    })
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Created variant:', variant.id)
    }

    // Test creating an order
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        total: 29.99,
        status: 'PENDING',
        orderItems: {
          create: {
            productId: product.id,
            variantId: variant.id,
            quantity: 1,
            price: 29.99,
          },
        },
      },
      include: {
        orderItems: true,
      },
    })
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Created order:', order.id)
    }

    // Test querying with relations
    const orders = await prisma.order.findMany({
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
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Found orders with relations:', orders.length)
    }

    // Cleanup test data
    await prisma.order.deleteMany({
      where: { userId: user.id },
    })
    await prisma.variant.deleteMany({
      where: { productId: product.id },
    })
    await prisma.product.deleteMany()
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' },
    })
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Cleaned up test data')
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🎉 All database tests passed!')
    }
  } catch (error) {
    console.error('❌ Database test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

export { testDatabaseConnection }
