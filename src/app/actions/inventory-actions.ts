'use server'

import { prisma as db } from '@/lib/db'
import {
  encryptCredentials,
  validateCredentialsFormat,
  type Credentials,
} from '@/lib/encryption'
import { revalidatePath } from 'next/cache'

export async function addAccounts(variantId: string, accountsText: string) {
  try {
    // Validate credentials format
    const credentials = validateCredentialsFormat(accountsText)

    if (credentials.length === 0) {
      return { success: false, error: 'No valid credentials provided' }
    }

    // Check for duplicates
    const existingAccounts = await db.account.findMany({
      where: { variantId },
      select: { credentials: true },
    })

    const existingCredentialsSet = new Set<string>()
    for (const account of existingAccounts) {
      try {
        const decrypted = JSON.parse(account.credentials) as Credentials
        existingCredentialsSet.add(`${decrypted.email}:${decrypted.password}`)
      } catch {
        // Skip invalid encrypted data
        continue
      }
    }

    const newCredentials = credentials.filter(cred => {
      const key = `${cred.email}:${cred.password}`
      return !existingCredentialsSet.has(key)
    })

    if (newCredentials.length === 0) {
      return { success: false, error: 'All credentials already exist' }
    }

    // Encrypt and batch insert
    const accountsToCreate = newCredentials.map(cred => ({
      variantId,
      credentials: encryptCredentials(cred),
      isSold: false,
    }))

    await db.account.createMany({
      data: accountsToCreate,
    })

    // Update variant stock
    await db.variant.update({
      where: { id: variantId },
      data: {
        stock: {
          increment: newCredentials.length,
        },
      },
    })

    revalidatePath('/admin/inventory')
    revalidatePath(`/admin/products/${variantId}`)

    return {
      success: true,
      message: `Successfully added ${newCredentials.length} accounts`,
      added: newCredentials.length,
      duplicates: credentials.length - newCredentials.length,
    }
  } catch (error) {
    console.error('Error adding accounts:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add accounts',
    }
  }
}

export async function getVariantStock(variantId: string) {
  try {
    const [total, sold] = await Promise.all([
      db.account.count({
        where: { variantId },
      }),
      db.account.count({
        where: { variantId, isSold: true },
      }),
    ])

    const available = total - sold

    return {
      total,
      sold,
      available,
    }
  } catch (error) {
    console.error('Error getting variant stock:', error)
    return {
      total: 0,
      sold: 0,
      available: 0,
    }
  }
}

export async function getAllInventory() {
  try {
    const variants = await db.variant.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            accounts: true,
          },
        },
      },
      orderBy: {
        product: {
          name: 'asc',
        },
      },
    })

    const inventory = await Promise.all(
      variants.map(async variant => {
        const stock = await getVariantStock(variant.id)

        return {
          id: variant.id,
          name: variant.name,
          price: variant.price,
          duration: variant.duration,
          product: variant.product,
          stock: {
            total: stock.total,
            sold: stock.sold,
            available: stock.available,
          },
        }
      })
    )

    return inventory
  } catch (error) {
    console.error('Error getting all inventory:', error)
    return []
  }
}

export async function getInventorySummary() {
  try {
    const inventory = await getAllInventory()

    const totalItems = inventory.reduce(
      (sum, variant) => sum + variant.stock.total,
      0
    )
    const totalSold = inventory.reduce(
      (sum, variant) => sum + variant.stock.sold,
      0
    )
    const totalAvailable = totalItems - totalSold

    const lowStockItems = inventory.filter(
      variant => variant.stock.available <= 5 && variant.stock.available > 0
    )
    const outOfStockItems = inventory.filter(
      variant => variant.stock.available === 0 && variant.stock.total > 0
    )

    return {
      totalItems,
      totalSold,
      totalAvailable,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStockItems,
      outOfStockItems,
    }
  } catch (error) {
    console.error('Error getting inventory summary:', error)
    return {
      totalItems: 0,
      totalSold: 0,
      totalAvailable: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      lowStockItems: [],
      outOfStockItems: [],
    }
  }
}
