'use server'

import { prisma } from '@/lib/db'
import { generateInvoiceNumber } from '@/lib/sepay-sdk'
import { z } from 'zod'

export type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'NAPAS_BANK_TRANSFER'

const CreateOrderItemSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
})

const CreateOrderSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  items: z.array(CreateOrderItemSchema).min(1, 'At least one item is required'),
  paymentMethod: z
    .enum(['BANK_TRANSFER', 'CARD', 'NAPAS_BANK_TRANSFER'])
    .default('BANK_TRANSFER'),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>

export interface CreateOrderResult {
  success: boolean
  orderId?: string
  invoiceNumber?: string
  totalAmount?: number
  error?: string
}

/**
 * Create a new order with Sepay payment integration
 *
 * @param input - Order creation data
 * @returns Order creation result with QR URL for payment
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  try {
    // Validate input
    const validatedInput = CreateOrderSchema.parse(input)
    const { userId, items, paymentMethod } = validatedInput

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    // Get variant details and validate stock
    const variantIds = items.map(item => item.variantId)
    const variants = await prisma.variant.findMany({
      where: {
        id: { in: variantIds },
        stock: { gt: 0 }, // Only show variants with stock
      },
      include: {
        product: {
          select: { id: true, name: true },
        },
      },
    })

    if (variants.length !== variantIds.length) {
      return {
        success: false,
        error: 'One or more variants not found or out of stock',
      }
    }

    // Calculate total and validate stock
    let totalAmount = 0
    const orderItems: Array<{
      variantId: string
      productId: string
      quantity: number
      price: number
    }> = []

    for (const item of items) {
      const variant = variants.find(v => v.id === item.variantId)
      if (!variant) {
        return {
          success: false,
          error: `Variant ${item.variantId} not found`,
        }
      }

      if (variant.stock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${variant.name}. Available: ${variant.stock}, Requested: ${item.quantity}`,
        }
      }

      const itemTotal = Number(variant.price) * item.quantity
      totalAmount += itemTotal

      orderItems.push({
        variantId: variant.id,
        productId: variant.productId,
        quantity: item.quantity,
        price: Number(variant.price),
      })
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber()

    // Create order and order items in a transaction
    const result = await prisma.$transaction(async tx => {
      // Create order
      const order = await tx.order.create({
        data: {
          userId,
          total: totalAmount,
          status: 'PENDING',
          invoiceNumber,
          paymentMethod,
        },
        include: {
          orderItems: true,
        },
      })

      // Create order items
      const createdOrderItems = await Promise.all(
        orderItems.map(item =>
          tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
            },
          })
        )
      )

      // Update variant stock
      await Promise.all(
        orderItems.map(item =>
          tx.variant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })
        )
      )

      return {
        order,
        orderItems: createdOrderItems,
      }
    })

    return {
      success: true,
      orderId: result.order.id,
      invoiceNumber,
      totalAmount,
    }
  } catch (error) {
    console.error('Error creating order:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e: any) => e.message).join(', ')}`,
      }
    }

    return {
      success: false,
      error: 'Failed to create order. Please try again.',
    }
  }
}

/**
 * Get order details for payment verification
 *
 * @param orderId - Order ID
 * @returns Order details or null if not found
 */
export async function getOrderForPayment(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true },
            },
            variant: {
              select: { id: true, name: true, duration: true },
            },
          },
        },
      },
    })

    return order
  } catch (error) {
    console.error('Error fetching order for payment:', error)
    return null
  }
}

/**
 * Check if order can be paid (status is PENDING)
 *
 * @param orderId - Order ID
 * @returns true if order can be paid
 */
export async function canOrderBePaid(orderId: string): Promise<boolean> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    })

    return order?.status === 'PENDING'
  } catch (error) {
    console.error('Error checking order payment status:', error)
    return false
  }
}
