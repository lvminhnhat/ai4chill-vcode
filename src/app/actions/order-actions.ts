'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      quantity: z.number().min(1),
      priceSnapshot: z.number(),
    })
  ),
  email: z.string().email(),
  name: z.string().optional(),
})

// Temporary order storage using OrderTemp table
async function createTempOrder(orderData: {
  id: string
  email: string
  items: any[]
  total: number
}) {
  try {
    // For now, use mock array until OrderTemp table is available
    mockOrders.push({
      id: orderData.id,
      customerEmail: orderData.email,
      total: orderData.total,
      status: 'PENDING',
      items: orderData.items,
      createdAt: new Date(),
    })
    return true
  } catch (error) {
    console.error('Failed to create temp order:', error)
    return false
  }
}

async function getTempOrder(orderId: string) {
  try {
    // For now, use mock array until OrderTemp table is available
    return mockOrders.find(order => order.id === orderId)
  } catch (error) {
    console.error('Failed to get temp order:', error)
    return null
  }
}

// Mock order storage for MVP (temporary until OrderTemp table migration is applied)
const mockOrders: Array<{
  id: string
  userId?: string
  customerEmail: string
  customerName?: string
  total: number
  status: string
  items: any[]
  createdAt: Date
}> = []

export async function createOrder(data: unknown) {
  try {
    // Validate input
    const parsed = createOrderSchema.safeParse(data)
    if (!parsed.success) {
      console.error('Validation error:', parsed.error)
      return { success: false, error: 'Dữ liệu không hợp lệ' }
    }

    const { items, email, name } = parsed.data

    // Get user session (optional for MVP)
    const session = await auth()

    // Calculate total
    const total = items.reduce(
      (sum: number, item: any) => sum + item.priceSnapshot * item.quantity,
      0
    )

    // Generate mock order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create mock order (for MVP - bypassing DB schema limitations)
    const mockOrder = {
      id: orderId,
      userId: session?.user?.id,
      customerEmail: email,
      customerName: name,
      total: total,
      status: 'PENDING',
      items: items,
      createdAt: new Date(),
    }

    // Store in mock array
    mockOrders.push(mockOrder)

    console.log('Mock order created:', mockOrder)

    // Try to create in DB if possible (for logged-in users with valid variantId)
    if (session?.user?.id) {
      try {
        const order = await prisma.$transaction(async tx => {
          // Create Order
          const newOrder = await tx.order.create({
            data: {
              userId: session.user.id,
              total: total,
              status: 'PENDING',
              invoiceNumber: `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            },
          })

          // Create OrderItems (only for items with variantId)
          for (const item of items) {
            if (item.variantId) {
              await tx.orderItem.create({
                data: {
                  orderId: newOrder.id,
                  productId: item.productId,
                  variantId: item.variantId,
                  quantity: item.quantity,
                  price: item.priceSnapshot,
                },
              })
            }
          }

          return newOrder
        })

        console.log('Real order also created in DB:', order.id)
        return { success: true, orderId: order.id }
      } catch (dbError) {
        console.log('DB creation failed, using mock order:', dbError)
        // Fall back to mock order
      }
    }

    return { success: true, orderId: mockOrder.id }
  } catch (error) {
    console.error('Create order error:', error)
    return {
      success: false,
      error: 'Không thể tạo đơn hàng. Vui lòng thử lại.',
    }
  }
}

// Check stock availability for order items
export async function checkOrderStockAvailability(
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
  }>
) {
  try {
    for (const item of items) {
      if (item.variantId) {
        // Check variant stock
        const variant = await prisma.variant.findUnique({
          where: { id: item.variantId },
          select: { stock: true, name: true },
        })

        if (!variant) {
          return {
            available: false,
            error: `Variant không tồn tại: ${item.variantId}`,
          }
        }

        if (variant.stock < item.quantity) {
          return {
            available: false,
            error: `Sản phẩm "${variant.name}" chỉ còn ${variant.stock} sản phẩm trong kho`,
          }
        }
      } else {
        // Check product stock (if product has stock field)
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        })

        if (!product) {
          return {
            available: false,
            error: `Sản phẩm không tồn tại: ${item.productId}`,
          }
        }
      }
    }

    return { available: true }
  } catch (error) {
    console.error('Stock check error:', error)
    return {
      available: false,
      error: 'Không thể kiểm tra tồn kho. Vui lòng thử lại.',
    }
  }
}

// Get order statistics for admin dashboard
export async function getOrderStats() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Calculate stats from mock orders
    const totalOrders = mockOrders.length
    const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0)
    const pendingOrders = mockOrders.filter(
      order => order.status === 'PENDING'
    ).length
    const paidOrders = mockOrders.filter(
      order => order.status === 'PAID'
    ).length
    const processingOrders = mockOrders.filter(
      order => order.status === 'PROCESSING'
    ).length

    return {
      success: true,
      stats: {
        totalOrders,
        totalRevenue,
        pendingOrders,
        paidOrders,
        processingOrders,
      },
    }
  } catch (error) {
    console.error('Get order stats error:', error)
    return { success: false, error: 'Failed to get order stats' }
  }
}

// Get all orders for admin
export async function getOrders(filters?: {
  status?: string
  searchQuery?: string
  page?: number
  limit?: number
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // For now, return mock orders with pagination structure
    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    let filteredOrders = mockOrders

    // Apply status filter
    if (filters?.status) {
      filteredOrders = filteredOrders.filter(
        order => order.status === filters.status
      )
    }

    // Apply search filter
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filteredOrders = filteredOrders.filter(
        order =>
          order.customerEmail.toLowerCase().includes(query) ||
          order.customerName?.toLowerCase().includes(query) ||
          order.id.toLowerCase().includes(query)
      )
    }

    const totalCount = filteredOrders.length
    const totalPages = Math.ceil(totalCount / limit)
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

    return {
      success: true,
      orders: paginatedOrders,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    }
  } catch (error) {
    console.error('Get orders error:', error)
    return { success: false, error: 'Failed to get orders' }
  }
}

// Get order by ID for admin
export async function getOrderById(orderId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const order = mockOrders.find(o => o.id === orderId)
    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    return { success: true, order }
  } catch (error) {
    console.error('Get order by ID error:', error)
    return { success: false, error: 'Failed to get order' }
  }
}

// Update order status
export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const orderIndex = mockOrders.findIndex(o => o.id === orderId)
    if (orderIndex === -1) {
      return { success: false, error: 'Order not found' }
    }

    mockOrders[orderIndex].status = status

    return { success: true, order: mockOrders[orderIndex] }
  } catch (error) {
    console.error('Update order status error:', error)
    return { success: false, error: 'Failed to update order status' }
  }
}

// Fulfill order (mark as processing/shipped)
export async function fulfillOrder(orderId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const orderIndex = mockOrders.findIndex(o => o.id === orderId)
    if (orderIndex === -1) {
      return { success: false, error: 'Order not found' }
    }

    mockOrders[orderIndex].status = 'PROCESSING'

    return { success: true, order: mockOrders[orderIndex] }
  } catch (error) {
    console.error('Fulfill order error:', error)
    return { success: false, error: 'Failed to fulfill order' }
  }
}

// Helper function to get mock order for success page with security checks
export async function getMockOrder(orderId: string, userEmail?: string) {
  const foundOrder = mockOrders.find(order => order.id === orderId)

  if (!foundOrder) {
    return null
  }

  // Security check: verify email ownership for guest orders
  if (userEmail && foundOrder.customerEmail !== userEmail) {
    console.warn(
      `Unauthorized access attempt: ${userEmail} trying to access order belonging to ${foundOrder.customerEmail}`
    )
    return null
  }

  return foundOrder
}
