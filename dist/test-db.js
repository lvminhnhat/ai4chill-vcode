"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDatabaseConnection = testDatabaseConnection;
const db_1 = require("./db");
async function testDatabaseConnection() {
    try {
        // Test basic connection
        await db_1.prisma.$connect();
        console.log('✅ Database connection successful');
        // Test creating a user
        const user = await db_1.prisma.user.create({
            data: {
                email: 'test@example.com',
                name: 'Test User',
            },
        });
        console.log('✅ Created user:', user.id);
        // Test creating a product
        const product = await db_1.prisma.product.create({
            data: {
                name: 'Test Product',
                description: 'A test product',
                price: 29.99,
            },
        });
        console.log('✅ Created product:', product.id);
        // Test creating a variant
        const variant = await db_1.prisma.variant.create({
            data: {
                productId: product.id,
                name: 'Large',
                price: 29.99,
                stock: 100,
            },
        });
        console.log('✅ Created variant:', variant.id);
        // Test creating an order
        const order = await db_1.prisma.order.create({
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
        });
        console.log('✅ Created order:', order.id);
        // Test querying with relations
        const orders = await db_1.prisma.order.findMany({
            include: {
                user: true,
                orderItems: {
                    include: {
                        product: true,
                        variant: true,
                    },
                },
            },
        });
        console.log('✅ Found orders with relations:', orders.length);
        // Cleanup test data
        await db_1.prisma.order.deleteMany({
            where: { userId: user.id },
        });
        await db_1.prisma.variant.deleteMany({
            where: { productId: product.id },
        });
        await db_1.prisma.product.deleteMany();
        await db_1.prisma.user.deleteMany({
            where: { email: 'test@example.com' },
        });
        console.log('✅ Cleaned up test data');
        console.log('🎉 All database tests passed!');
    }
    catch (error) {
        console.error('❌ Database test failed:', error);
    }
    finally {
        await db_1.prisma.$disconnect();
    }
}
// Run test if this file is executed directly
if (require.main === module) {
    testDatabaseConnection();
}
