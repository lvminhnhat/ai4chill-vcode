'use server'

import { prisma } from '@/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import {
  ProductFormSchema,
  ProductFormData,
  VariantFormSchema,
  VariantFormData,
} from '@/lib/schemas/product-schema'

// Get all products with variants count
export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
          },
        },
        _count: {
          select: {
            variants: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform data to include price range
    return products.map(product => ({
      ...product,
      priceRange: {
        min:
          product.variants.length > 0
            ? Math.min(
                ...product.variants.map(v => parseFloat(v.price.toString()))
              )
            : parseFloat(product.price.toString()),
        max:
          product.variants.length > 0
            ? Math.max(
                ...product.variants.map(v => parseFloat(v.price.toString()))
              )
            : parseFloat(product.price.toString()),
      },
    }))
  } catch (error) {
    console.error('Error fetching products:', error)
    throw new Error('Failed to fetch products')
  }
}

// Get single product by ID
export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!product) {
      throw new Error('Product not found')
    }

    return product
  } catch (error) {
    console.error('Error fetching product:', error)
    throw new Error('Failed to fetch product')
  }
}

// Create new product
export async function createProduct(data: ProductFormData) {
  try {
    const validatedData = ProductFormSchema.parse(data)

    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
      },
      include: {
        variants: true,
      },
    })

    revalidatePath('/admin/products')
    return { success: true, product }
  } catch (error) {
    console.error('Error creating product:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.issues,
      }
    }

    return {
      success: false,
      error: 'Failed to create product',
    }
  }
}

// Update existing product
export async function updateProduct(id: string, data: ProductFormData) {
  try {
    const validatedData = ProductFormSchema.parse(data)

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return {
        success: false,
        error: 'Product not found',
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
      },
      include: {
        variants: true,
      },
    })

    revalidatePath('/admin/products')
    return { success: true, product }
  } catch (error) {
    console.error('Error updating product:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.issues,
      }
    }

    return {
      success: false,
      error: 'Failed to update product',
    }
  }
}

// Delete product
export async function deleteProduct(id: string) {
  try {
    // Check if product exists and get variant count
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            variants: true,
            orderItems: true,
          },
        },
      },
    })

    if (!product) {
      return {
        success: false,
        error: 'Product not found',
      }
    }

    // Check if product has variants
    if (product._count.variants > 0) {
      return {
        success: false,
        error:
          'Cannot delete product with existing variants. Please delete variants first.',
      }
    }

    // Check if product has order items
    if (product._count.orderItems > 0) {
      return {
        success: false,
        error: 'Cannot delete product with existing orders.',
      }
    }

    await prisma.product.delete({
      where: { id },
    })

    revalidatePath('/admin/products')
    return { success: true }
  } catch (error) {
    console.error('Error deleting product:', error)
    return {
      success: false,
      error: 'Failed to delete product',
    }
  }
}

// Create new variant
export async function createVariant(productId: string, data: VariantFormData) {
  try {
    const validatedData = VariantFormSchema.parse(data)

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return {
        success: false,
        error: 'Product not found',
      }
    }

    const variant = await prisma.variant.create({
      data: {
        productId,
        name: validatedData.name,
        price: validatedData.price,
        duration: validatedData.duration,
        stock: validatedData.stock,
      },
    })

    revalidatePath(`/admin/products/${productId}`)
    revalidatePath('/admin/products')
    return { success: true, variant }
  } catch (error) {
    console.error('Error creating variant:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.issues,
      }
    }

    return {
      success: false,
      error: 'Failed to create variant',
    }
  }
}

// Update existing variant
export async function updateVariant(id: string, data: VariantFormData) {
  try {
    const validatedData = VariantFormSchema.parse(data)

    // Check if variant exists
    const existingVariant = await prisma.variant.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!existingVariant) {
      return {
        success: false,
        error: 'Variant not found',
      }
    }

    const variant = await prisma.variant.update({
      where: { id },
      data: {
        name: validatedData.name,
        price: validatedData.price,
        duration: validatedData.duration,
        stock: validatedData.stock,
      },
    })

    revalidatePath(`/admin/products/${existingVariant.productId}`)
    revalidatePath('/admin/products')
    return { success: true, variant }
  } catch (error) {
    console.error('Error updating variant:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.issues,
      }
    }

    return {
      success: false,
      error: 'Failed to update variant',
    }
  }
}

// Delete variant
export async function deleteVariant(id: string) {
  try {
    // Check if variant exists and get order items count
    const variant = await prisma.variant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    })

    if (!variant) {
      return {
        success: false,
        error: 'Variant not found',
      }
    }

    // Check if variant has order items
    if (variant._count.orderItems > 0) {
      return {
        success: false,
        error: 'Cannot delete variant with existing orders.',
      }
    }

    await prisma.variant.delete({
      where: { id },
    })

    revalidatePath(`/admin/products/${variant.productId}`)
    revalidatePath('/admin/products')
    return { success: true }
  } catch (error) {
    console.error('Error deleting variant:', error)
    return {
      success: false,
      error: 'Failed to delete variant',
    }
  }
}
