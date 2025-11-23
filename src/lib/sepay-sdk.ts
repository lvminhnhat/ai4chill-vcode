/**
 * SePay SDK Client Wrapper
 *
 * This module provides a wrapper around the sepay-pg-node SDK with utility functions
 * for payment processing, checkout URL generation, and webhook validation.
 */

import { SePayPgClient } from 'sepay-pg-node'

// Environment variable validation
const REQUIRED_ENV_VARS = [
  'SEPAY_ENV',
  'SEPAY_MERCHANT_ID',
  'SEPAY_SECRET_KEY',
] as const

function validateEnvironment(): void {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Please check your .env configuration.'
    )
  }
}

// Singleton SDK client instance
let sepayClient: SePayPgClient | null = null

function getSePayClient(): SePayPgClient {
  if (!sepayClient) {
    validateEnvironment()

    sepayClient = new SePayPgClient({
      env: process.env.SEPAY_ENV as 'sandbox' | 'production',
      merchant_id: process.env.SEPAY_MERCHANT_ID!,
      secret_key: process.env.SEPAY_SECRET_KEY!,
    })
  }

  return sepayClient
}

// Type definitions
export type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'NAPAS_BANK_TRANSFER'

export interface CheckoutParams {
  payment_method: PaymentMethod
  order_invoice_number: string
  order_amount: number
  currency: 'VND'
  order_description: string
  success_url: string
  error_url: string
  cancel_url: string
  buyer_name?: string
  buyer_email?: string
  buyer_phone?: string
}

export interface CheckoutFields {
  signature: string
  merchant?: string
  operation?: 'PURCHASE'
  payment_method?: 'BANK_TRANSFER' | 'NAPAS_BANK_TRANSFER'
  order_invoice_number: string
  order_amount: number
  currency: string
  order_description: string
  order_tax_amount?: number
  customer_id?: string
  success_url?: string
  error_url?: string
  cancel_url?: string
  custom_data?: string
}

export interface InvoiceNumberOptions {
  prefix?: string
  separator?: string
}

/**
 * Get the checkout URL from the SePay SDK
 *
 * @returns The checkout URL for the payment gateway
 */
export function getCheckoutUrl(): string {
  try {
    const client = getSePayClient()
    return client.checkout.initCheckoutUrl()
  } catch (error) {
    throw new Error(
      `Failed to get checkout URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Create checkout form fields with the provided parameters
 *
 * @param params - Checkout parameters
 * @returns Form fields object for payment checkout
 */
export function createCheckoutFields(params: CheckoutParams): CheckoutFields {
  try {
    const client = getSePayClient()

    // Validate amount first
    if (params.order_amount <= 0) {
      throw new Error('Order amount must be greater than 0')
    }

    // Validate required parameters
    const requiredFields: (keyof CheckoutParams)[] = [
      'payment_method',
      'order_invoice_number',
      'order_amount',
      'currency',
      'order_description',
      'success_url',
      'error_url',
      'cancel_url',
    ]

    for (const field of requiredFields) {
      if (!params[field]) {
        throw new Error(`Missing required parameter: ${field}`)
      }
    }

    // Validate URLs
    const urlFields = ['success_url', 'error_url', 'cancel_url'] as const
    for (const field of urlFields) {
      try {
        new URL(params[field])
      } catch {
        throw new Error(`${field} must be a valid absolute URL`)
      }
    }

    // Validate currency
    if (params.currency !== 'VND') {
      throw new Error('Only VND currency is supported')
    }

    // Map payment method to SDK format
    const sdkPaymentMethod =
      params.payment_method === 'CARD'
        ? undefined
        : (params.payment_method as 'BANK_TRANSFER' | 'NAPAS_BANK_TRANSFER')

    // Create checkout fields using SDK
    const fields = client.checkout.initOneTimePaymentFields({
      payment_method: sdkPaymentMethod,
      order_invoice_number: params.order_invoice_number,
      order_amount: params.order_amount,
      currency: params.currency,
      order_description: params.order_description,
      success_url: params.success_url,
      error_url: params.error_url,
      cancel_url: params.cancel_url,
      customer_id: params.buyer_email, // Use email as customer_id if available
      custom_data: JSON.stringify({
        buyer_name: params.buyer_name,
        buyer_email: params.buyer_email,
        buyer_phone: params.buyer_phone,
      }),
    })

    return fields
  } catch (error) {
    throw new Error(
      `Failed to create checkout fields: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate a unique invoice number with format: INV-{timestamp}-{random}
 *
 * @param options - Optional configuration for invoice number generation
 * @returns Unique invoice number string
 */
export function generateInvoiceNumber(
  options: InvoiceNumberOptions = {}
): string {
  const { prefix = 'INV', separator = '-' } = options

  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()

  return `${prefix}${separator}${timestamp}${separator}${random}`
}

/**
 * Validate IPN (Instant Payment Notification) webhook signature
 *
 * @param payload - The webhook payload data
 * @param signature - The signature from the webhook header
 * @returns true if signature is valid, false otherwise
 */
export function validateIpnSignature(
  payload: any,
  signature?: string
): boolean {
  try {
    // SECURITY: Always require signature
    if (!signature) {
      console.error('IPN signature is required but not provided')
      return false
    }

    const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET

    // SECURITY: Fail fast if secret not configured in production
    if (!webhookSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'SEPAY_WEBHOOK_SECRET must be configured in production. ' +
            'This is a critical security requirement to prevent payment fraud.'
        )
      }

      console.warn(
        '⚠️  SEPAY_WEBHOOK_SECRET not configured - ' +
          'skipping signature validation in development mode only. ' +
          'This MUST be configured before production deployment!'
      )
      return true
    }

    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex')

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )

    if (!isValid) {
      console.error('IPN signature validation failed')
    }

    return isValid
  } catch (error) {
    console.error('Error validating IPN signature:', error)
    if (error instanceof Error && error.message.includes('production')) {
      throw error
    }
    return false
  }
}

/**
 * Get the SDK client instance (for advanced usage)
 *
 * @returns The SePay SDK client instance
 */
export function getClient(): SePayPgClient {
  return getSePayClient()
}

/**
 * Reset the SDK client singleton (useful for testing)
 */
export function resetClient(): void {
  sepayClient = null
}

/**
 * Check if the SDK is properly configured
 *
 * @returns true if SDK is configured and ready to use
 */
export function isConfigured(): boolean {
  try {
    validateEnvironment()
    return true
  } catch {
    return false
  }
}

// Export the singleton client instance
export { getSePayClient as sepayClient }

// Export types for external use
export type { SePayPgClient } from 'sepay-pg-node'
