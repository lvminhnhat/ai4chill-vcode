/**
 * Example usage of SePay SDK Client Wrapper
 *
 * This file demonstrates how to use the SePay SDK wrapper for payment processing.
 */

import {
  getCheckoutUrl,
  createCheckoutFields,
  generateInvoiceNumber,
  validateIpnSignature,
  isConfigured,
  CheckoutParams,
} from './sepay-sdk'

// Example 1: Check if SDK is configured
export function checkConfiguration() {
  if (isConfigured()) {
    console.log('✅ SePay SDK is properly configured')
  } else {
    console.log('❌ SePay SDK is missing required environment variables')
  }
}

// Example 2: Generate a unique invoice number
export function createInvoiceNumber() {
  const invoiceNumber = generateInvoiceNumber()
  console.log('Generated invoice number:', invoiceNumber)

  // Custom invoice number with prefix
  const customInvoiceNumber = generateInvoiceNumber({
    prefix: 'ORDER',
    separator: '_',
  })
  console.log('Custom invoice number:', customInvoiceNumber)

  return invoiceNumber
}

// Example 3: Create checkout fields for a payment
export function createPaymentCheckout() {
  const invoiceNumber = generateInvoiceNumber()

  const checkoutParams: CheckoutParams = {
    payment_method: 'BANK_TRANSFER',
    order_invoice_number: invoiceNumber,
    order_amount: 299000, // 299,000 VND
    currency: 'VND',
    order_description: 'AI4CHILL ChatGPT Plus Subscription',
    success_url: 'https://ai4chill.com/payment/success',
    error_url: 'https://ai4chill.com/payment/error',
    cancel_url: 'https://ai4chill.com/payment/cancel',
    buyer_name: 'John Doe',
    buyer_email: 'john.doe@example.com',
    buyer_phone: '0123456789',
  }

  try {
    const checkoutFields = createCheckoutFields(checkoutParams)
    console.log('Checkout fields created:', checkoutFields)

    // Get the checkout URL
    const checkoutUrl = getCheckoutUrl()
    console.log('Checkout URL:', checkoutUrl)

    // In a real application, you would use these fields to create a payment form
    // or redirect the user to the payment gateway

    return {
      checkoutUrl,
      checkoutFields,
      invoiceNumber,
    }
  } catch (error) {
    console.error('Failed to create checkout:', error)
    throw error
  }
}

// Example 4: Handle different payment methods
export function createCheckoutForDifferentMethods() {
  const invoiceNumber = generateInvoiceNumber()
  const baseParams = {
    order_invoice_number: invoiceNumber,
    order_amount: 499000,
    currency: 'VND' as const,
    order_description: 'AI4CHILL Claude Pro Subscription',
    success_url: 'https://ai4chill.com/payment/success',
    error_url: 'https://ai4chill.com/payment/error',
    cancel_url: 'https://ai4chill.com/payment/cancel',
    buyer_name: 'Jane Smith',
    buyer_email: 'jane.smith@example.com',
    buyer_phone: '0987654321',
  }

  const paymentMethods = [
    'BANK_TRANSFER',
    'CARD',
    'NAPAS_BANK_TRANSFER',
  ] as const

  paymentMethods.forEach(method => {
    try {
      const checkoutFields = createCheckoutFields({
        ...baseParams,
        payment_method: method,
      })

      console.log(`Checkout fields for ${method}:`, {
        payment_method: checkoutFields.payment_method,
        signature: checkoutFields.signature,
        order_amount: checkoutFields.order_amount,
      })
    } catch (error) {
      console.error(`Failed to create checkout for ${method}:`, error)
    }
  })
}

// Example 5: Validate IPN webhook signature
export function validateWebhookSignature() {
  // Example webhook payload
  const webhookPayload = {
    id: 'txn_123456789',
    gateway: 'SEPAY',
    transactionDate: '2025-01-23T10:30:00Z',
    accountNumber: '1234567890',
    amount: 299000,
    content: 'AI4CHILL INV-1737648200000-ABC123',
    referenceCode: 'REF123456',
    description: 'AI4CHILL INV-1737648200000-ABC123',
    status: 'SUCCESS',
  }

  // Example signature (in real scenario, this comes from webhook header)
  const crypto = require('crypto')
  const webhookSecret =
    process.env.SEPAY_WEBHOOK_SECRET || 'test_webhook_secret'
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(webhookPayload))
    .digest('hex')

  // Validate signature
  const isValid = validateIpnSignature(webhookPayload, signature)
  console.log(
    'Webhook signature validation:',
    isValid ? '✅ Valid' : '❌ Invalid'
  )

  // Test with invalid signature
  const isInvalid = validateIpnSignature(webhookPayload, 'invalid_signature')
  console.log(
    'Invalid signature test:',
    isInvalid ? '❌ Should be invalid' : '✅ Correctly rejected'
  )

  return isValid
}

// Example 6: Complete payment flow
export async function completePaymentFlow() {
  try {
    // 1. Check configuration
    if (!isConfigured()) {
      throw new Error('SDK not configured')
    }

    // 2. Generate invoice number
    const invoiceNumber = generateInvoiceNumber()
    console.log('📝 Invoice:', invoiceNumber)

    // 3. Create checkout
    const checkoutParams: CheckoutParams = {
      payment_method: 'BANK_TRANSFER',
      order_invoice_number: invoiceNumber,
      order_amount: 199000,
      currency: 'VND',
      order_description: 'AI4CHILL Gemini Advanced',
      success_url: 'https://ai4chill.com/payment/success',
      error_url: 'https://ai4chill.com/payment/error',
      cancel_url: 'https://ai4chill.com/payment/cancel',
      buyer_name: 'Test User',
      buyer_email: 'test@example.com',
    }

    const checkoutFields = createCheckoutFields(checkoutParams)
    const checkoutUrl = getCheckoutUrl()

    console.log('🔗 Checkout URL:', checkoutUrl)
    console.log('📋 Checkout Fields:', {
      signature: checkoutFields.signature,
      amount: checkoutFields.order_amount,
      description: checkoutFields.order_description,
    })

    // 4. In a real application, you would:
    // - Save the order to database
    // - Redirect user to payment gateway
    // - Handle webhook notifications
    // - Update order status based on payment result

    return {
      success: true,
      invoiceNumber,
      checkoutUrl,
      checkoutFields,
    }
  } catch (error) {
    console.error('❌ Payment flow failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Example usage (uncomment to run)
// checkConfiguration()
// createInvoiceNumber()
// createPaymentCheckout()
// createCheckoutForDifferentMethods()
// validateWebhookSignature()
// completePaymentFlow()
