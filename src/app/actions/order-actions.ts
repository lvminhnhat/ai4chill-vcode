'use server'

import { prisma } from '@/lib/db'
import { OrderStatus } from '@/generated/prisma'
import { z } from 'zod'

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
