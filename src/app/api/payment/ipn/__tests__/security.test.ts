/**
 * Security Tests for SePay IPN Webhook Handler
 */

// Mock all dependencies before importing
jest.mock('@/lib/db')
jest.mock('@/lib/sepay-sdk')
jest.mock('@/lib/sepay-ip-validator')
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data: any, init: any = {}) => ({
      status: init.status || 200,
      json: async () => data,
      headers: new Map(Object.entries(init.headers || {})),
    })),
  },
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'
import { prisma } from '@/lib/db'
import { validateIpnSignature } from '@/lib/sepay-sdk'
import { isIPAllowed, getClientIP } from '@/lib/sepay-ip-validator'

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

jest.mock('@/lib/sepay-sdk', () => ({
  validateIpnSignature: jest.fn(),
}))

jest.mock('@/lib/sepay-ip-validator', () => ({
  isIPAllowed: jest.fn(),
  getClientIP: jest.fn(),
}))

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  jest.clearAllMocks()

  // Set up default environment variables for testing
  process.env = {
    ...originalEnv,
    NODE_ENV: 'test',
    SEPAY_WEBHOOK_SECRET: 'test_webhook_secret',
    SEPAY_ALLOWED_IPS: '192.168.1.100,10.0.0.1',
  }
})

afterEach(() => {
  process.env = originalEnv
})

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

describe('IPN Webhook Security Tests', () => {
  const mockOrder = {
    id: 'order-123',
    invoiceNumber: 'INV-1234567890-ABC123',
    total: 299000,
    status: 'PENDING',
    user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
    orderItems: [],
  }

  const validPayload = {
    order_invoice_number: 'INV-1234567890-ABC123',
    sepay_order_id: 'SP-987654321',
    status: 'ORDER_PAID',
    amount: 299000,
    payment_method: 'BANK_TRANSFER',
    transaction_time: '2025-01-23T10:30:00Z',
    signature: 'valid-signature',
  }

  describe('Signature Validation', () => {
    beforeEach(() => {
      // Mock IP validation to pass for signature tests
      ;(getClientIP as jest.Mock).mockReturnValue('192.168.1.100')
      ;(isIPAllowed as jest.Mock).mockReturnValue(true)
      // Mock order lookup
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
    })

    it('should reject requests without signature', async () => {
      // Mock validateIpnSignature to return false for missing signature
      ;(validateIpnSignature as jest.Mock).mockReturnValue(false)

      const request = {
        url: 'http://localhost:3000/api/payment/ipn',
        method: 'POST',
        headers: new Map([['Content-Type', 'application/json']]),
        text: jest.fn().mockResolvedValue(JSON.stringify(validPayload)),
      }

      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Invalid signature')
      expect(validateIpnSignature).toHaveBeenCalledWith(validPayload, undefined)
    })

    it('should reject requests with invalid signature', async () => {
      // Mock validateIpnSignature to return false for invalid signature
      ;(validateIpnSignature as jest.Mock).mockReturnValue(false)

      const request = {
        url: 'http://localhost:3000/api/payment/ipn',
        method: 'POST',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['x-sepay-signature', 'invalid-signature'],
        ]),
        text: jest.fn().mockResolvedValue(JSON.stringify(validPayload)),
      }

      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Invalid signature')
      expect(validateIpnSignature).toHaveBeenCalledWith(
        validPayload,
        'invalid-signature'
      )
    })

    it('should accept requests with valid signature', async () => {
      // Mock validateIpnSignature to return true for valid signature
      ;(validateIpnSignature as jest.Mock).mockReturnValue(true)

      // Mock transaction processing
      ;(prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.$transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return await callback({
            order: {
              update: jest.fn().mockResolvedValue({
                ...mockOrder,
                status: 'PAID',
                paymentMethod: 'BANK_TRANSFER',
              }),
            },
            transaction: {
              create: jest.fn().mockResolvedValue({
                id: 'txn-123',
                orderId: 'order-123',
                amount: 299000,
                status: 'SUCCESS',
                provider: 'SEPAY',
                sepayOrderId: 'SP-987654321',
                paymentMethod: 'BANK_TRANSFER',
                reference: 'IPN-SP-987654321-2025-01-23T10:30:00Z',
              }),
            },
          })
        }
      )

      const request = {
        url: 'http://localhost:3000/api/payment/ipn',
        method: 'POST',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['x-sepay-signature', 'valid-signature'],
        ]),
        text: jest.fn().mockResolvedValue(JSON.stringify(validPayload)),
      }

      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(validateIpnSignature).toHaveBeenCalledWith(
        validPayload,
        'valid-signature'
      )
    })
  })

  describe('IP Whitelist Validation', () => {
    beforeEach(() => {
      // Mock signature validation to pass for IP tests
      ;(validateIpnSignature as jest.Mock).mockReturnValue(true)
      // Mock order lookup
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
    })

    it('should reject requests from unauthorized IPs when whitelist is enabled', async () => {
      // Mock IP detection and validation
      ;(getClientIP as jest.Mock).mockReturnValue('192.168.1.200') // Unauthorized IP
      ;(isIPAllowed as jest.Mock).mockReturnValue(false)

      const request = {
        url: 'http://localhost:3000/api/payment/ipn',
        method: 'POST',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['x-sepay-signature', 'valid-signature'],
        ]),
        text: jest.fn().mockResolvedValue(JSON.stringify(validPayload)),
      }

      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.error).toBe('Forbidden - IP not allowed')
      expect(getClientIP).toHaveBeenCalledWith(request)
      expect(isIPAllowed).toHaveBeenCalledWith('192.168.1.200', [
        '192.168.1.100',
        '10.0.0.1',
      ])
    })

    it('should accept requests from authorized IPs when whitelist is enabled', async () => {
      // Mock IP detection and validation
      ;(getClientIP as jest.Mock).mockReturnValue('192.168.1.100') // Authorized IP
      ;(isIPAllowed as jest.Mock).mockReturnValue(true)

      // Mock transaction processing
      ;(prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.$transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return await callback({
            order: {
              update: jest.fn().mockResolvedValue({
                ...mockOrder,
                status: 'PAID',
                paymentMethod: 'BANK_TRANSFER',
              }),
            },
            transaction: {
              create: jest.fn().mockResolvedValue({
                id: 'txn-123',
                orderId: 'order-123',
                amount: 299000,
                status: 'SUCCESS',
                provider: 'SEPAY',
                sepayOrderId: 'SP-987654321',
                paymentMethod: 'BANK_TRANSFER',
                reference: 'IPN-SP-987654321-2025-01-23T10:30:00Z',
              }),
            },
          })
        }
      )

      const request = {
        url: 'http://localhost:3000/api/payment/ipn',
        method: 'POST',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['x-sepay-signature', 'valid-signature'],
        ]),
        text: jest.fn().mockResolvedValue(JSON.stringify(validPayload)),
      }

      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(getClientIP).toHaveBeenCalledWith(request)
      expect(isIPAllowed).toHaveBeenCalledWith('192.168.1.100', [
        '192.168.1.100',
        '10.0.0.1',
      ])
    })

    it('should allow requests when IP whitelist is disabled (empty env var)', async () => {
      // Disable IP whitelist
      delete process.env.SEPAY_ALLOWED_IPS

      // Mock transaction processing
      ;(prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.$transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return await callback({
            order: {
              update: jest.fn().mockResolvedValue({
                ...mockOrder,
                status: 'PAID',
                paymentMethod: 'BANK_TRANSFER',
              }),
            },
            transaction: {
              create: jest.fn().mockResolvedValue({
                id: 'txn-123',
                orderId: 'order-123',
                amount: 299000,
                status: 'SUCCESS',
                provider: 'SEPAY',
                sepayOrderId: 'SP-987654321',
                paymentMethod: 'BANK_TRANSFER',
                reference: 'IPN-SP-987654321-2025-01-23T10:30:00Z',
              }),
            },
          })
        }
      )

      const request = {
        url: 'http://localhost:3000/api/payment/ipn',
        method: 'POST',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['x-sepay-signature', 'valid-signature'],
        ]),
        text: jest.fn().mockResolvedValue(JSON.stringify(validPayload)),
      }

      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      // IP validation should not be called when whitelist is disabled
      expect(getClientIP).not.toHaveBeenCalled()
      expect(isIPAllowed).not.toHaveBeenCalled()
    })
  })

  describe('Amount Validation', () => {
    beforeEach(() => {
      // Mock signature validation to pass for amount tests
      ;(validateIpnSignature as jest.Mock).mockReturnValue(true)
      // Mock IP validation to pass
      ;(getClientIP as jest.Mock).mockReturnValue('192.168.1.100')
      ;(isIPAllowed as jest.Mock).mockReturnValue(true)
      // Mock order lookup
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
    })

    it('should reject requests with amount mismatch > 1 VND', async () => {
      const payloadWithWrongAmount = {
        ...validPayload,
        amount: 299002, // 2 VND difference
      }

      const request = {
        url: 'http://localhost:3000/api/payment/ipn',
        method: 'POST',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['x-sepay-signature', 'valid-signature'],
        ]),
        text: jest
          .fn()
          .mockResolvedValue(JSON.stringify(payloadWithWrongAmount)),
      }

      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Amount mismatch')
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Amount mismatch for order INV-1234567890-ABC123'
        )
      )
    })

    it('should accept requests with amount difference <= 1 VND', async () => {
      const payloadWithSmallDifference = {
        ...validPayload,
        amount: 299001, // 1 VND difference - should be accepted
      }

      // Mock transaction processing
      ;(prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.$transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return await callback({
            order: {
              update: jest.fn().mockResolvedValue({
                ...mockOrder,
                status: 'PAID',
                paymentMethod: 'BANK_TRANSFER',
              }),
            },
            transaction: {
              create: jest.fn().mockResolvedValue({
                id: 'txn-123',
                orderId: 'order-123',
                amount: 299001,
                status: 'SUCCESS',
                provider: 'SEPAY',
                sepayOrderId: 'SP-987654321',
                paymentMethod: 'BANK_TRANSFER',
                reference: 'IPN-SP-987654321-2025-01-23T10:30:00Z',
              }),
            },
          })
        }
      )

      const request = {
        url: 'http://localhost:3000/api/payment/ipn',
        method: 'POST',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['x-sepay-signature', 'valid-signature'],
        ]),
        text: jest
          .fn()
          .mockResolvedValue(JSON.stringify(payloadWithSmallDifference)),
      }

      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
    })

    it('should accept requests with exact amount match', async () => {
      // Mock transaction processing
      ;(prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.$transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return await callback({
            order: {
              update: jest.fn().mockResolvedValue({
                ...mockOrder,
                status: 'PAID',
                paymentMethod: 'BANK_TRANSFER',
              }),
            },
            transaction: {
              create: jest.fn().mockResolvedValue({
                id: 'txn-123',
                orderId: 'order-123',
                amount: 299000,
                status: 'SUCCESS',
                provider: 'SEPAY',
                sepayOrderId: 'SP-987654321',
                paymentMethod: 'BANK_TRANSFER',
                reference: 'IPN-SP-987654321-2025-01-23T10:30:00Z',
              }),
            },
          })
        }
      )

      const request = {
        url: 'http://localhost:3000/api/payment/ipn',
        method: 'POST',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['x-sepay-signature', 'valid-signature'],
        ]),
        text: jest.fn().mockResolvedValue(JSON.stringify(validPayload)),
      }

      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
    })
  })

  describe('Environment Validation', () => {
    beforeEach(() => {
      // Mock signature validation to pass for environment tests
      ;(validateIpnSignature as jest.Mock).mockReturnValue(true)
      // Mock IP validation to pass
      ;(getClientIP as jest.Mock).mockReturnValue('192.168.1.100')
      ;(isIPAllowed as jest.Mock).mockReturnValue(true)
      // Mock order lookup
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
    })

    it('should require SEPAY_WEBHOOK_SECRET in production', async () => {
      // Set production environment using Object.defineProperty
      const originalNodeEnv = process.env.NODE_ENV
      Object.defineProperty(process, 'env', {
        value: { ...process.env, NODE_ENV: 'production' },
        writable: true,
        configurable: true,
      })
      delete process.env.SEPAY_WEBHOOK_SECRET

      // Mock validateIpnSignature to throw error for missing secret
      ;(validateIpnSignature as jest.Mock).mockImplementation(() => {
        throw new Error('SEPAY_WEBHOOK_SECRET must be configured in production')
      })

      const request = {
        url: 'http://localhost:3000/api/payment/ipn',
        method: 'POST',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['x-sepay-signature', 'valid-signature'],
        ]),
        text: jest.fn().mockResolvedValue(JSON.stringify(validPayload)),
      }

      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
      expect(console.error).toHaveBeenCalledWith(
        'Error processing SePay IPN:',
        expect.any(Error)
      )

      // Reset NODE_ENV
      Object.defineProperty(process, 'env', {
        value: { ...process.env, NODE_ENV: originalNodeEnv },
        writable: true,
        configurable: true,
      })
    })

    it('should work without SEPAY_WEBHOOK_SECRET in development', async () => {
      // Set development environment using Object.defineProperty
      const originalNodeEnv = process.env.NODE_ENV
      Object.defineProperty(process, 'env', {
        value: { ...process.env, NODE_ENV: 'development' },
        writable: true,
        configurable: true,
      })
      delete process.env.SEPAY_WEBHOOK_SECRET

      // Mock validateIpnSignature to pass in development
      ;(validateIpnSignature as jest.Mock).mockReturnValue(true)

      // Mock transaction processing
      ;(prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.$transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return await callback({
            order: {
              update: jest.fn().mockResolvedValue({
                ...mockOrder,
                status: 'PAID',
                paymentMethod: 'BANK_TRANSFER',
              }),
            },
            transaction: {
              create: jest.fn().mockResolvedValue({
                id: 'txn-123',
                orderId: 'order-123',
                amount: 299000,
                status: 'SUCCESS',
                provider: 'SEPAY',
                sepayOrderId: 'SP-987654321',
                paymentMethod: 'BANK_TRANSFER',
                reference: 'IPN-SP-987654321-2025-01-23T10:30:00Z',
              }),
            },
          })
        }
      )

      const request = {
        url: 'http://localhost:3000/api/payment/ipn',
        method: 'POST',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['x-sepay-signature', 'valid-signature'],
        ]),
        text: jest.fn().mockResolvedValue(JSON.stringify(validPayload)),
      }

      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)

      // Reset NODE_ENV
      Object.defineProperty(process, 'env', {
        value: { ...process.env, NODE_ENV: originalNodeEnv },
        writable: true,
        configurable: true,
      })
    })
  })

  describe('Complete Security Validation Flow', () => {
    it('should accept valid requests with correct signature and amount', async () => {
      // Mock all validations to pass
      ;(validateIpnSignature as jest.Mock).mockReturnValue(true)
      ;(getClientIP as jest.Mock).mockReturnValue('192.168.1.100')
      ;(isIPAllowed as jest.Mock).mockReturnValue(true)

      // Mock order lookup and transaction processing
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.$transaction as jest.Mock).mockImplementation(
        async (callback: any) => {
          return await callback({
            order: {
              update: jest.fn().mockResolvedValue({
                ...mockOrder,
                status: 'PAID',
                paymentMethod: 'BANK_TRANSFER',
              }),
            },
            transaction: {
              create: jest.fn().mockResolvedValue({
                id: 'txn-123',
                orderId: 'order-123',
                amount: 299000,
                status: 'SUCCESS',
                provider: 'SEPAY',
                sepayOrderId: 'SP-987654321',
                paymentMethod: 'BANK_TRANSFER',
                reference: 'IPN-SP-987654321-2025-01-23T10:30:00Z',
              }),
            },
          })
        }
      )

      const request = {
        url: 'http://localhost:3000/api/payment/ipn',
        method: 'POST',
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['x-sepay-signature', 'valid-signature'],
        ]),
        text: jest.fn().mockResolvedValue(JSON.stringify(validPayload)),
      }

      const response = await POST(request as any)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.orderId).toBe('order-123')
      expect(result.status).toBe('PAID')
      expect(result.sepayOrderId).toBe('SP-987654321')

      // Verify all security checks were called
      expect(validateIpnSignature).toHaveBeenCalledWith(
        validPayload,
        'valid-signature'
      )
      expect(getClientIP).toHaveBeenCalledWith(request)
      expect(isIPAllowed).toHaveBeenCalledWith('192.168.1.100', [
        '192.168.1.100',
        '10.0.0.1',
      ])
    })
  })
})
