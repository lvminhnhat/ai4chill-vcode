import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Get order details by ID
 *
 * This endpoint is used by payment callback pages to display
 * order information after payment completion.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
        transactions: {
          select: {
            id: true,
            status: true,
            amount: true,
            provider: true,
            sepayOrderId: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: order.id,
      status: order.status,
      total: order.total,
      invoiceNumber: order.invoiceNumber,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: order.user,
      items: order.orderItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        product: item.product,
        variant: item.variant,
      })),
      transaction: order.transactions[0] || null,
    })
  } catch (error) {
    console.error('Error fetching order details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    )
  }
}
