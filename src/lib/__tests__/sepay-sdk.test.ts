/**
 * Tests for SePay SDK Client Wrapper
 */

import {
  getCheckoutUrl,
  createCheckoutFields,
  generateInvoiceNumber,
  validateIpnSignature,
  getClient,
  resetClient,
  isConfigured,
  CheckoutParams,
} from '../sepay-sdk'

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = {
    ...originalEnv,
    SEPAY_ENV: 'sandbox',
    SEPAY_MERCHANT_ID: 'test_merchant_id',
    SEPAY_SECRET_KEY: 'test_secret_key',
    SEPAY_WEBHOOK_SECRET: 'test_webhook_secret',
  }
})

afterEach(() => {
  process.env = originalEnv
  resetClient()
})

describe('SePay SDK Wrapper', () => {
  describe('Environment Validation', () => {
    it('should throw error when required environment variables are missing', () => {
      delete process.env.SEPAY_MERCHANT_ID

      expect(() => getCheckoutUrl()).toThrow(
        'Missing required environment variables: SEPAY_MERCHANT_ID'
      )
    })

    it('should return true when all required environment variables are set', () => {
      expect(isConfigured()).toBe(true)
    })

    it('should return false when required environment variables are missing', () => {
      delete process.env.SEPAY_SECRET_KEY
      expect(isConfigured()).toBe(false)
    })
  })

  describe('getCheckoutUrl', () => {
    it('should return checkout URL', () => {
      const url = getCheckoutUrl()
      expect(typeof url).toBe('string')
      expect(url).toBeTruthy()
    })

    it('should throw error when SDK is not configured', () => {
      delete process.env.SEPAY_ENV
      expect(() => getCheckoutUrl()).toThrow()
    })
  })

  describe('createCheckoutFields', () => {
    const validParams: CheckoutParams = {
      payment_method: 'BANK_TRANSFER',
      order_invoice_number: 'INV-123456',
      order_amount: 100000,
      currency: 'VND',
      order_description: 'Test payment',
      success_url: 'https://example.com/success',
      error_url: 'https://example.com/error',
      cancel_url: 'https://example.com/cancel',
      buyer_name: 'John Doe',
      buyer_email: 'john@example.com',
      buyer_phone: '0123456789',
    }

    it('should create checkout fields with valid parameters', () => {
      const fields = createCheckoutFields(validParams)

      expect(fields).toHaveProperty('signature')
      expect(fields).toHaveProperty(
        'order_invoice_number',
        validParams.order_invoice_number
      )
      expect(fields).toHaveProperty('order_amount', validParams.order_amount)
      expect(fields).toHaveProperty('currency', validParams.currency)
      expect(fields).toHaveProperty(
        'order_description',
        validParams.order_description
      )
      expect(fields).toHaveProperty('success_url', validParams.success_url)
      expect(fields).toHaveProperty('error_url', validParams.error_url)
      expect(fields).toHaveProperty('cancel_url', validParams.cancel_url)
    })

    it('should throw error when required parameter is missing', () => {
      const invalidParams = { ...validParams }
      delete (invalidParams as any).payment_method

      expect(() =>
        createCheckoutFields(invalidParams as CheckoutParams)
      ).toThrow('Missing required parameter: payment_method')
    })

    it('should throw error when amount is less than or equal to 0', () => {
      const invalidParams = { ...validParams, order_amount: 0 }

      expect(() => createCheckoutFields(invalidParams)).toThrow(
        'Failed to create checkout fields: Order amount must be greater than 0'
      )
    })

    it('should throw error when URL is invalid', () => {
      const invalidParams = {
        ...validParams,
        success_url: 'invalid-url',
      }

      expect(() => createCheckoutFields(invalidParams)).toThrow(
        'success_url must be a valid absolute URL'
      )
    })

    it('should throw error when currency is not VND', () => {
      const invalidParams = {
        ...validParams,
        currency: 'USD' as any,
      }

      expect(() => createCheckoutFields(invalidParams)).toThrow(
        'Only VND currency is supported'
      )
    })

    it('should handle CARD payment method', () => {
      const cardParams = { ...validParams, payment_method: 'CARD' as const }
      const fields = createCheckoutFields(cardParams)

      expect(fields.payment_method).toBeUndefined()
    })

    it('should include buyer information in custom_data', () => {
      const fields = createCheckoutFields(validParams)
      const customData = JSON.parse(fields.custom_data || '{}')

      expect(customData.buyer_name).toBe(validParams.buyer_name)
      expect(customData.buyer_email).toBe(validParams.buyer_email)
      expect(customData.buyer_phone).toBe(validParams.buyer_phone)
    })
  })

  describe('generateInvoiceNumber', () => {
    it('should generate invoice number with default format', () => {
      const invoiceNumber = generateInvoiceNumber()
      expect(invoiceNumber).toMatch(/^INV-\d+-[A-Z0-9]{6}$/)
    })

    it('should generate invoice number with custom prefix', () => {
      const invoiceNumber = generateInvoiceNumber({ prefix: 'ORDER' })
      expect(invoiceNumber).toMatch(/^ORDER-\d+-[A-Z0-9]{6}$/)
    })

    it('should generate invoice number with custom separator', () => {
      const invoiceNumber = generateInvoiceNumber({ separator: '_' })
      expect(invoiceNumber).toMatch(/^INV_\d+_[A-Z0-9]{6}$/)
    })

    it('should generate unique invoice numbers', () => {
      const invoice1 = generateInvoiceNumber()
      const invoice2 = generateInvoiceNumber()

      expect(invoice1).not.toBe(invoice2)
    })
  })

  describe('validateIpnSignature', () => {
    const payload = {
      id: 'test-id',
      amount: 100000,
      status: 'SUCCESS',
    }

    it('should return true when signature is valid', () => {
      const crypto = require('crypto')
      const signature = crypto
        .createHmac('sha256', 'test_webhook_secret')
        .update(JSON.stringify(payload))
        .digest('hex')

      const isValid = validateIpnSignature(payload, signature)
      expect(isValid).toBe(true)
    })

    it('should return false when signature is invalid', () => {
      const isValid = validateIpnSignature(payload, 'invalid-signature')
      expect(isValid).toBe(false)
    })

    it('should return true when no signature is provided (with warning)', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const isValid = validateIpnSignature(payload)

      expect(isValid).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith(
        'No IPN signature provided - validation may be less secure'
      )

      consoleSpy.mockRestore()
    })

    it('should return true when webhook secret is not configured (with warning)', () => {
      delete process.env.SEPAY_WEBHOOK_SECRET
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const isValid = validateIpnSignature(payload, 'some-signature')

      expect(isValid).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith(
        'SEPAY_WEBHOOK_SECRET not configured - skipping signature validation'
      )

      consoleSpy.mockRestore()
    })
  })

  describe('getClient', () => {
    it('should return SDK client instance', () => {
      const client = getClient()
      expect(client).toBeDefined()
      expect(typeof client.checkout).toBe('object')
      expect(typeof client.order).toBe('object')
    })
  })

  describe('resetClient', () => {
    it('should reset the client singleton', () => {
      const client1 = getClient()
      resetClient()
      const client2 = getClient()

      expect(client1).toBeDefined()
      expect(client2).toBeDefined()
      expect(client1).not.toBe(client2)
    })
  })
})
