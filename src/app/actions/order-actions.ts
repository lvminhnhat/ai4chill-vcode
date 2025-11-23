'use server'

import { prisma } from '@/lib/db'
import { OrderStatus } from '@/generated/prisma'
import { z } from 'zod'
import { decryptCredentials } from '@/lib/encryption'
import { sendOrderDeliveredEmail } from '@/lib/email'

const OrderFiltersSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  searchQuery: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export type OrderFilters = z.infer<typeof OrderFiltersSchema>

export async function getOrders(filters: Partial<OrderFilters> = {}) {
  const validatedFilters = OrderFiltersSchema.parse(filters)
  const { status, searchQuery, page, limit } = validatedFilters

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}

  if (status) {
    where.status = status
  }

  if (searchQuery) {
    where.OR = [
      {
        id: {
          contains: searchQuery,
          mode: 'insensitive',
        },
      },
      {
        user: {
          email: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
      },
      {
        user: {
          name: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
      },
    ]
  }

  try {
    // Get orders with pagination
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
                },
              },
            },
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      orders,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    }
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw new Error('Failed to fetch orders')
  }
}

export async function getOrderById(id: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                duration: true,
              },
            },
          },
        },
      },
    })

    return order
  } catch (error) {
    console.error('Error fetching order:', error)
    throw new Error('Failed to fetch order')
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { status: true },
    })

    if (!order) {
      throw new Error('Order not found')
    }

    // Prevent status changes to delivered/cancelled orders
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      throw new Error('Cannot update status of delivered or cancelled orders')
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return updatedOrder
  } catch (error) {
    console.error('Error updating order status:', error)
    throw new Error('Failed to update order status')
  }
}

export async function fulfillOrder(
  orderId: string
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    // Validate order exists and is PAID
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
                duration: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return { success: false, message: 'Order not found' }
    }

    if (order.status !== ('PAID' as any)) {
      return {
        success: false,
        message: `Order must be PAID to fulfill. Current status: ${order.status}`,
      }
    }

    // Check if already fulfilled
    if (order.status === 'DELIVERED') {
      return { success: false, message: 'Order already delivered' }
    }

    // Collect all credentials needed for fulfillment
    const fulfillmentData: any[] = []
    const credentialsForEmail: any[] = []

    for (const orderItem of order.orderItems) {
      // Find available accounts for this variant
      const availableAccounts = await prisma.account.findMany({
        where: {
          variantId: orderItem.variantId,
          isSold: false,
        },
        take: orderItem.quantity,
      })

      if (availableAccounts.length < orderItem.quantity) {
        const variant = await prisma.variant.findUnique({
          where: { id: orderItem.variantId },
          include: {
            _count: {
              select: {
                accounts: {
                  where: { isSold: false },
                },
              },
            },
          },
        })

        return {
          success: false,
          message: `Not enough accounts available for ${orderItem.product.name} - ${orderItem.variant.name}. Required: ${orderItem.quantity}, Available: ${availableAccounts.length}`,
        }
      }

      // Process each account for this order item
      for (const account of availableAccounts) {
        try {
          // Decrypt credentials
          const credentials = decryptCredentials(account.credentials)

          fulfillmentData.push({
            accountId: account.id,
            orderItemId: orderItem.id,
            credentials,
          })

          credentialsForEmail.push({
            productName: orderItem.product.name,
            variantName: orderItem.variant.name,
            duration: orderItem.variant.duration,
            email: credentials.email,
            password: credentials.password,
          })
        } catch (decryptError) {
          console.error(
            'Failed to decrypt credentials for account:',
            account.id,
            decryptError
          )
          return {
            success: false,
            message: `Failed to decrypt credentials for ${orderItem.product.name}. Please contact support.`,
          }
        }
      }
    }

    // Use Prisma transaction for atomic fulfillment
    const result = await prisma.$transaction(async tx => {
      // Mark all accounts as sold
      for (const data of fulfillmentData) {
        await tx.account.update({
          where: { id: data.accountId },
          data: { isSold: true },
        })
      }

      // Update order status to DELIVERED
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'DELIVERED' },
        include: {
          user: {
            select: {
              id: true,
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

      return updatedOrder
    })

    // Send delivery email
    const emailResult = await sendOrderDeliveredEmail(
      order.user.email,
      {
        ...result,
        total: Number(result.total),
        orderItems: result.orderItems.map((item: any) => ({
          ...item,
          price: Number(item.price),
        })),
      },
      credentialsForEmail
    )

    if (!emailResult.success) {
      // Log the error but don't rollback the transaction
      // Order is still fulfilled, just email failed
      console.error('Failed to send delivery email:', emailResult.error)

      // In production, you might want to:
      // 1. Queue email for retry
      // 2. Notify admin
      // 3. Add a flag to order indicating email failed

      return {
        success: true,
        message:
          'Order fulfilled successfully, but email delivery failed. Please contact customer manually.',
        error: emailResult.error,
      }
    }

    // Log fulfillment action (optional audit trail)
    console.log(
      `Order ${orderId} fulfilled successfully. Email sent: ${emailResult.emailId}`
    )

    return {
      success: true,
      message:
        'Order fulfilled successfully! Customer has been notified via email.',
    }
  } catch (error) {
    console.error('Error fulfilling order:', error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to fulfill order',
    }
  }
}

export async function checkOrderStockAvailability(
  orderItems: Array<{ variantId: string; quantity: number }>
) {
  try {
    const stockChecks = await Promise.all(
      orderItems.map(async item => {
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
          throw new Error(`Variant not found: ${item.variantId}`)
        }

        const available = variant._count.accounts
        const isSufficient = available >= item.quantity

        return {
          variantId: item.variantId,
          variantName: variant.name,
          productName: variant.product.name,
          required: item.quantity,
          available,
          isSufficient,
        }
      })
    )

    const hasSufficientStock = stockChecks.every(check => check.isSufficient)

    return {
      hasSufficientStock,
      stockInfo: stockChecks,
    }
  } catch (error) {
    console.error('Error checking stock availability:', error)
    throw new Error('Failed to check stock availability')
  }
}

export async function getOrderStats() {
  try {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.aggregate({
        where: {
          status: {
            in: ['PROCESSING', 'SHIPPED', 'DELIVERED'],
          },
        },
        _sum: {
          total: true,
        },
      }),
    ])

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: totalRevenue._sum.total || 0,
    }
  } catch (error) {
    console.error('Error fetching order stats:', error)
    throw new Error('Failed to fetch order stats')
  }
}
