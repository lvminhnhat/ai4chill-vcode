/**
 * Tests for SePay IPN Webhook Handler
 */

import { NextRequest } from 'next/server'
import { POST } from '../route'
import { prisma } from '@/lib/db'
import { mockIpnPayloads } from '@/lib/__tests__/test-ipn-webhook'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

// Mock console methods to avoid noise in tests
const originalConsole = global.console
beforeAll(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }
})

afterAll(() => {
  global.console = originalConsole
})

describe('IPN Webhook Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/payment/ipn', () => {
    it('should process successful payment correctly', async () => {
      const mockOrder = {
        id: 'order-123',
        invoiceNumber: 'INV-1234567890-ABC123',
        total: 299000,
        status: 'PENDING',
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        orderItems: [],
      }

      const mockTransaction = {
        id: 'txn-123',
        orderId: 'order-123',
        amount: 299000,
        status: 'SUCCESS',
        provider: 'SEPAY',
        sepayOrderId: 'SP-987654321',
        paymentMethod: 'BANK_TRANSFER',
        reference: 'IPN-SP-987654321-2025-01-23T10:30:00Z',
      }

      // Mock Prisma responses
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async callback => {
        return await callback({
          order: {
            update: jest.fn().mockResolvedValue({
              ...mockOrder,
              status: 'CONFIRMED',
              paymentMethod: 'BANK_TRANSFER',
            }),
          },
          transaction: {
            create: jest.fn().mockResolvedValue(mockTransaction),
          },
        })
      })

      // Create mock request
      const request = new NextRequest('http://localhost:3000/api/payment/ipn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sepay-signature': 'mock-signature-success',
        },
        body: JSON.stringify(mockIpnPayloads.successfulPayment),
      })

      // Mock text() method
      request.text = jest
        .fn()
        .mockResolvedValue(JSON.stringify(mockIpnPayloads.successfulPayment))

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.orderId).toBe('order-123')
      expect(result.status).toBe('CONFIRMED')
      expect(result.sepayOrderId).toBe('SP-987654321')
    })

    it('should handle failed payment correctly', async () => {
      const mockOrder = {
        id: 'order-456',
        invoiceNumber: 'INV-1234567891-DEF456',
        total: 199000,
        status: 'PENDING',
        user: {
          id: 'user-456',
          email: 'test2@example.com',
          name: 'Test User 2',
        },
        orderItems: [],
      }

      const mockTransaction = {
        id: 'txn-456',
        orderId: 'order-456',
        amount: 199000,
        status: 'FAILED',
        provider: 'SEPAY',
        sepayOrderId: 'SP-987654322',
        paymentMethod: 'CARD',
        reference: 'IPN-SP-987654322-2025-01-23T11:00:00Z',
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async callback => {
        return await callback({
          order: {
            update: jest.fn().mockResolvedValue({
              ...mockOrder,
              status: 'CANCELLED',
              paymentMethod: 'CARD',
            }),
          },
          transaction: {
            create: jest.fn().mockResolvedValue(mockTransaction),
          },
        })
      })

      const request = new NextRequest('http://localhost:3000/api/payment/ipn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sepay-signature': 'mock-signature-failed',
        },
        body: JSON.stringify(mockIpnPayloads.failedPayment),
      })

      request.text = jest
        .fn()
        .mockResolvedValue(JSON.stringify(mockIpnPayloads.failedPayment))

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.status).toBe('CANCELLED')
    })

    it('should return 404 for non-existent order', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/payment/ipn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sepay-signature': 'mock-signature',
        },
        body: JSON.stringify(mockIpnPayloads.successfulPayment),
      })

      request.text = jest
        .fn()
        .mockResolvedValue(JSON.stringify(mockIpnPayloads.successfulPayment))

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toBe('Order not found')
    })

    it('should return 400 for amount mismatch', async () => {
      const mockOrder = {
        id: 'order-789',
        invoiceNumber: 'INV-1234567894-MNO345',
        total: 399000, // Different from payload amount
        status: 'PENDING',
        user: {
          id: 'user-789',
          email: 'test3@example.com',
          name: 'Test User 3',
        },
        orderItems: [],
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)

      const request = new NextRequest('http://localhost:3000/api/payment/ipn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sepay-signature': 'mock-signature-mismatch',
        },
        body: JSON.stringify(mockIpnPayloads.amountMismatch),
      })

      request.text = jest
        .fn()
        .mockResolvedValue(JSON.stringify(mockIpnPayloads.amountMismatch))

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Amount mismatch')
    })

    it('should handle duplicate transactions idempotently', async () => {
      const mockOrder = {
        id: 'order-duplicate',
        invoiceNumber: 'INV-1234567890-ABC123',
        total: 299000,
        status: 'CONFIRMED', // Already processed
        user: {
          id: 'user-duplicate',
          email: 'test@example.com',
          name: 'Test User',
        },
        orderItems: [],
      }

      const mockExistingTransaction = {
        id: 'txn-existing',
        reference: 'IPN-SP-987654321-2025-01-23T10:30:00Z',
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(prisma.transaction.findFirst as jest.Mock).mockResolvedValue(
        mockExistingTransaction
      )

      const request = new NextRequest('http://localhost:3000/api/payment/ipn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sepay-signature': 'mock-signature-success',
        },
        body: JSON.stringify(mockIpnPayloads.successfulPayment),
      })

      request.text = jest
        .fn()
        .mockResolvedValue(JSON.stringify(mockIpnPayloads.successfulPayment))

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.message).toBe('Transaction already processed')
      expect(result.transactionId).toBe('txn-existing')
    })

    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment/ipn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid-json',
      })

      request.text = jest.fn().mockResolvedValue('invalid-json')

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid JSON')
    })

    it('should return 400 for missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment/ipn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sepay-signature': 'mock-signature',
        },
        body: JSON.stringify(mockIpnPayloads.missingFields),
      })

      request.text = jest
        .fn()
        .mockResolvedValue(JSON.stringify(mockIpnPayloads.missingFields))

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('Missing required field')
    })
  })

  describe('GET /api/payment/ipn', () => {
    it('should return webhook status information', async () => {
      const { GET } = require('../route')

      const response = await GET()
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.message).toBe('SePay IPN webhook endpoint is active')
      expect(result.version).toBe('1.0.0')
      expect(result.supported_statuses).toContain('ORDER_PAID')
      expect(result.supported_statuses).toContain('ORDER_FAILED')
    })
  })
})
