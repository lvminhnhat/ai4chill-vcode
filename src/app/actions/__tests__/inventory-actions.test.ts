import {
  addAccounts,
  getVariantStock,
  getAllInventory,
  getInventorySummary,
} from '@/app/actions/inventory-actions'
import { db } from '@/lib/db'

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    account: {
      findMany: jest.fn(),
      count: jest.fn(),
      createMany: jest.fn(),
    },
    variant: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock encryption
jest.mock('@/lib/encryption', () => ({
  encryptCredentials: jest.fn(data => `encrypted-${JSON.stringify(data)}`),
  validateCredentialsFormat: jest.fn(text => {
    const lines = text.trim().split('\n')
    return lines.map(line => {
      const [email, password] = line.split(':')
      return { email, password }
    })
  }),
}))

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('Inventory Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('addAccounts', () => {
    it('should add accounts successfully', async () => {
      const mockAccounts = [
        { email: 'test1@example.com', password: 'pass1' },
        { email: 'test2@example.com', password: 'pass2' },
      ]

      ;(db.account.findMany as jest.Mock).mockResolvedValue([])
      ;(db.account.createMany as jest.Mock).mockResolvedValue({ count: 2 })
      ;(db.variant.update as jest.Mock).mockResolvedValue({})

      const result = await addAccounts(
        'variant-1',
        'test1@example.com:pass1\ntest2@example.com:pass2'
      )

      expect(result.success).toBe(true)
      expect(result.added).toBe(2)
      expect(db.account.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            variantId: 'variant-1',
            credentials: expect.stringContaining('encrypted-'),
          }),
        ]),
      })
    })

    it('should handle duplicate accounts', async () => {
      const mockExistingAccounts = [
        { credentials: '{"email":"test1@example.com","password":"pass1"}' },
      ]

      ;(db.account.findMany as jest.Mock).mockResolvedValue(
        mockExistingAccounts
      )
      ;(db.account.createMany as jest.Mock).mockResolvedValue({ count: 1 })

      const result = await addAccounts(
        'variant-1',
        'test1@example.com:pass1\ntest2@example.com:pass2'
      )

      expect(result.success).toBe(true)
      expect(result.added).toBe(1)
      expect(result.duplicates).toBe(1)
    })

    it('should return error for invalid format', async () => {
      const { validateCredentialsFormat } = require('@/lib/encryption')
      validateCredentialsFormat.mockImplementation(() => {
        throw new Error('Invalid format')
      })

      const result = await addAccounts('variant-1', 'invalid-format')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid format')
    })
  })

  describe('getVariantStock', () => {
    it('should return stock information', async () => {
      ;(db.account.count as jest.Mock)
        .mockResolvedValueOnce(10) // total count
        .mockResolvedValueOnce(3) // sold count

      const result = await getVariantStock('variant-1')

      expect(result).toEqual({
        total: 10,
        sold: 3,
        available: 7,
      })
    })

    it('should handle database errors', async () => {
      ;(db.account.count as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const result = await getVariantStock('variant-1')

      expect(result).toEqual({
        total: 0,
        sold: 0,
        available: 0,
      })
    })
  })

  describe('getAllInventory', () => {
    it('should return inventory with stock information', async () => {
      const mockVariants = [
        {
          id: 'variant-1',
          name: 'Variant 1',
          price: '10.00',
          duration: '1 month',
          product: { id: 'product-1', name: 'Product 1' },
          _count: { accounts: 5 },
        },
      ]

      ;(db.variant.findMany as jest.Mock).mockResolvedValue(mockVariants)
      ;(db.account.count as jest.Mock)
        .mockResolvedValueOnce(5) // total count
        .mockResolvedValueOnce(2) // sold count

      const result = await getAllInventory()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'variant-1',
          name: 'Variant 1',
          stock: {
            total: 5,
            sold: 2,
            available: 3,
          },
        })
      )
    })
  })

  describe('getInventorySummary', () => {
    it('should return inventory summary', async () => {
      // Mock the variant data directly
      const mockVariants = [
        {
          id: 'variant-1',
          name: 'Variant 1',
          price: '10.00',
          duration: '1 month',
          product: { id: 'product-1', name: 'Product 1' },
          _count: { accounts: 10 },
        },
        {
          id: 'variant-2',
          name: 'Variant 2',
          price: '20.00',
          duration: '2 months',
          product: { id: 'product-1', name: 'Product 1' },
          _count: { accounts: 5 },
        },
        {
          id: 'variant-3',
          name: 'Variant 3',
          price: '30.00',
          duration: '3 months',
          product: { id: 'product-2', name: 'Product 2' },
          _count: { accounts: 3 },
        },
      ]

      ;(db.variant.findMany as jest.Mock).mockResolvedValue(mockVariants)

      // Mock stock counts for each variant
      ;(db.account.count as jest.Mock)
        .mockResolvedValueOnce(10) // variant-1 total
        .mockResolvedValueOnce(3) // variant-1 sold
        .mockResolvedValueOnce(5) // variant-2 total
        .mockResolvedValueOnce(5) // variant-2 sold
        .mockResolvedValueOnce(3) // variant-3 total
        .mockResolvedValueOnce(0) // variant-3 sold

      const result = await getInventorySummary()

      expect(result).toEqual({
        totalItems: 18,
        totalSold: 8,
        totalAvailable: 10,
        lowStockCount: 1, // variant-3 has 3 available
        outOfStockCount: 1, // variant-2 has 0 available
        lowStockItems: expect.arrayContaining([
          expect.objectContaining({
            stock: { total: 3, sold: 0, available: 3 },
          }),
        ]),
        outOfStockItems: expect.arrayContaining([
          expect.objectContaining({
            stock: { total: 5, sold: 5, available: 0 },
          }),
        ]),
      })
    })
  })
})
