import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  console.log('Clearing existing data...')
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.variant.deleteMany()
  await prisma.product.deleteMany()

  // Seed products with variants
  const products = [
    {
      name: 'ChatGPT Plus',
      description:
        'Access to GPT-4, faster response times, and priority access to new features',
      price: 150000,
      image: '/images/products/chatgpt.jpg',
      category: 'AI Chat',
      variants: [
        { name: '1 Month', price: 150000, stock: 50, duration: '1 Month' },
        { name: '3 Months', price: 400000, stock: 30, duration: '3 Months' },
        { name: '6 Months', price: 750000, stock: 20, duration: '6 Months' },
      ],
    },
    {
      name: 'ChatGPT Team',
      description:
        'Collaborative workspace for teams with unlimited GPT-4 access',
      price: 300000,
      image: '/images/products/chatgpt-team.jpg',
      category: 'AI Chat',
      variants: [
        { name: '1 Month', price: 300000, stock: 30, duration: '1 Month' },
        { name: '3 Months', price: 850000, stock: 15, duration: '3 Months' },
      ],
    },
    {
      name: 'Claude Pro',
      description: 'Anthropic Claude with extended context and priority access',
      price: 180000,
      image: '/images/products/claude.jpg',
      category: 'AI Chat',
      variants: [
        { name: '1 Month', price: 180000, stock: 45, duration: '1 Month' },
        { name: '6 Months', price: 900000, stock: 10, duration: '6 Months' },
      ],
    },
    {
      name: 'Claude API',
      description: 'API access to Claude for developers and businesses',
      price: 250000,
      image: '/images/products/claude-api.jpg',
      category: 'AI Chat',
      variants: [
        { name: '1 Month', price: 150000, stock: 50, duration: '1 Month' },
        { name: '3 Months', price: 400000, stock: 30, duration: '3 Months' },
        { name: '6 Months', price: 750000, stock: 20, duration: '6 Months' },
      ],
    },
    {
      name: 'DALL-E',
      description: 'AI image generation with OpenAI DALL-E',
      price: 120000,
      image: '/images/products/dalle.jpg',
      category: 'AI Art',
      variants: [
        {
          name: '100 Credits',
          price: 120000,
          stock: 60,
          duration: '100 Credits',
        },
        {
          name: '500 Credits',
          price: 550000,
          stock: 30,
          duration: '500 Credits',
        },
      ],
    },
    {
      name: 'Midjourney',
      description: 'Premium AI art generation subscription',
      price: 350000,
      image: '/images/products/midjourney.jpg',
      category: 'AI Art',
      variants: [
        {
          name: 'Basic Plan',
          price: 350000,
          stock: 25,
          duration: 'Basic Plan',
        },
        {
          name: 'Standard Plan',
          price: 700000,
          stock: 15,
          duration: 'Standard Plan',
        },
        { name: 'Pro Plan', price: 1400000, stock: 10, duration: 'Pro Plan' },
      ],
    },
    {
      name: 'GitHub Copilot',
      description: 'AI-powered code completion for developers',
      price: 280000,
      image: '/images/products/github-copilot.jpg',
      category: 'AI Coding',
      variants: [
        { name: '1 Month', price: 280000, stock: 50, duration: '1 Month' },
        { name: '1 Year', price: 2800000, stock: 20, duration: '1 Year' },
      ],
    },
    {
      name: 'Gemini Advanced',
      description: 'Google Gemini with advanced AI capabilities',
      price: 220000,
      image: '/images/products/gemini.jpg',
      category: 'AI Chat',
      variants: [
        { name: '1 Month', price: 220000, stock: 35, duration: '1 Month' },
        { name: '6 Months', price: 1200000, stock: 15, duration: '6 Months' },
      ],
    },
  ]

  for (const productData of products) {
    const { variants, ...productInfo } = productData

    const product = await prisma.product.create({
      data: productInfo,
    })

    // Create variants separately
    for (const variantData of variants) {
      await prisma.variant.create({
        data: {
          ...variantData,
          productId: product.id,
        },
      })
    }

    const createdProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: { variants: true },
    })

    console.log(
      `✅ Created product: ${product.name} with ${createdProduct?.variants.length || 0} variants`
    )
  }

  console.log('🎉 Database seed completed!')
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
