import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session-utils'
import { prisma } from '@/lib/db'

interface StockCheckRequest {
  items: Array<{
    variantId: string
    quantity: number
  }>
}

interface StockInfo {
  variantId: string
  variantName: string
  productName: string
  required: number
  available: number
  isSufficient: boolean
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body: StockCheckRequest = await request.json()

    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const stockInfo: StockInfo[] = []

    for (const item of body.items) {
      // Get variant info with product name
      const variant = await prisma.variant.findUnique({
        where: { id: item.variantId },
        include: {
          product: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              accounts: {
                where: { isSold: false },
              },
            },
          },
        },
      })

      if (!variant) {
        return NextResponse.json(
          { error: `Variant not found: ${item.variantId}` },
          { status: 404 }
        )
      }

      const available = variant._count.accounts
      const isSufficient = available >= item.quantity

      stockInfo.push({
        variantId: item.variantId,
        variantName: variant.name,
        productName: variant.product.name,
        required: item.quantity,
        available,
        isSufficient,
      })
    }

    return NextResponse.json({
      success: true,
      stockInfo,
    })
  } catch (error) {
    console.error('Error checking stock:', error)

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
