/**
 * Sepay Payment Integration Utilities
 *
 * This module provides utilities for integrating with Sepay payment gateway
 * including QR code generation and webhook validation.
 */

export interface SepayQRConfig {
  accountNumber: string
  accountName: string
  bankCode: string
  amount: number
  description: string
  template?: 'compact' | 'default'
}

export interface SepayWebhookPayload {
  id: string
  gateway: string
  transactionDate: string
  accountNumber: string
  amount: number
  content: string
  referenceCode: string
  description: string
  [key: string]: any
}

export interface TransactionData {
  orderId: string
  amount: number
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
  provider: 'SEPAY'
  gatewayData: SepayWebhookPayload
}

/**
 * Generate Sepay QR code URL for payment
 *
 * @param orderId - Order ID to include in description
 * @param amount - Payment amount in VND
 * @param options - Additional QR configuration options
 * @returns QR code URL
 */
export function generateQRUrl(
  orderId: string,
  amount: number,
  options?: Partial<SepayQRConfig>
): string {
  const accountNumber =
    options?.accountNumber || process.env.SEPAY_ACCOUNT_NUMBER
  const accountName = options?.accountName || process.env.SEPAY_ACCOUNT_NAME
  const bankCode = options?.bankCode || process.env.SEPAY_BANK_CODE || 'MB'
  const description = options?.description || `AI4CHILL ${orderId}`
  const template = options?.template || 'compact'

  if (!accountNumber) {
    throw new Error('SEPAY_ACCOUNT_NUMBER environment variable is required')
  }

  // Validate amount
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0')
  }

  // Format amount to integer (Sepay expects integer amount)
  const formattedAmount = Math.round(amount)

  // Build QR URL parameters
  const params = new URLSearchParams({
    acc: accountNumber,
    amount: formattedAmount.toString(),
    des: description,
  })

  // Add optional parameters
  if (accountName) {
    params.append('name', accountName)
  }
  if (bankCode) {
    params.append('bank', bankCode)
  }

  // Generate QR URL
  const baseUrl =
    template === 'compact' ? 'https://qr.sepay.vn/img' : 'https://qr.sepay.vn'

  return `${baseUrl}?${params.toString()}`
}

/**
 * Validate webhook signature (if Sepay provides signature)
 *
 * @param payload - Raw webhook payload
 * @param signature - Webhook signature from header
 * @returns true if signature is valid
 */
export function validateWebhookSignature(
  payload: string,
  signature?: string
): boolean {
  // If no signature is provided, we'll rely on IP whitelist and other validations
  if (!signature) {
    console.warn('No webhook signature provided - relying on IP whitelist')
    return true
  }

  const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.warn(
      'SEPAY_WEBHOOK_SECRET not configured - skipping signature validation'
    )
    return true
  }

  // TODO: Implement actual signature validation based on Sepay's documentation
  // This is a placeholder implementation
  try {
    // Example: HMAC-SHA256 validation (adjust based on Sepay's actual method)
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex')

    return signature === expectedSignature
  } catch (error) {
    console.error('Error validating webhook signature:', error)
    return false
  }
}

/**
 * Extract order ID from Sepay transaction description
 *
 * @param description - Transaction description from Sepay
 * @returns Order ID if found, null otherwise
 */
export function extractOrderIdFromDescription(
  description: string
): string | null {
  // Description format: "AI4CHILL {ORDER_ID}"
  const match = description.match(/AI4CHILL\s+(.+)/i)
  return match ? match[1].trim() : null
}

/**
 * Format amount for display
 *
 * @param amount - Amount in VND
 * @returns Formatted amount string
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

/**
 * Validate webhook payload structure
 *
 * @param payload - Webhook payload to validate
 * @returns true if payload is valid
 */
export function validateWebhookPayload(
  payload: any
): payload is SepayWebhookPayload {
  return (
    payload &&
    typeof payload.id === 'string' &&
    typeof payload.gateway === 'string' &&
    typeof payload.transactionDate === 'string' &&
    typeof payload.accountNumber === 'string' &&
    typeof payload.amount === 'number' &&
    typeof payload.content === 'string' &&
    typeof payload.referenceCode === 'string' &&
    typeof payload.description === 'string'
  )
}

/**
 * Check if IP address is in allowed list (for webhook security)
 *
 * @param ip - IP address to check
 * @returns true if IP is allowed
 */
export function isAllowedIP(ip: string): boolean {
  // Get allowed IPs from environment variable (comma-separated)
  const allowedIPs =
    process.env.SEPAY_ALLOWED_IPS?.split(',').map(s => s.trim()) || []

  // If no IPs are configured, allow all (for development)
  if (allowedIPs.length === 0) {
    console.warn('No SEPAY_ALLOWED_IPS configured - allowing all IPs')
    return true
  }

  return allowedIPs.includes(ip)
}

/**
 * Generate unique transaction reference for idempotency
 *
 * @param payload - Webhook payload
 * @returns Unique reference string
 */
export function generateTransactionReference(
  payload: SepayWebhookPayload
): string {
  return `${payload.gateway}-${payload.id}-${payload.transactionDate}`
}
