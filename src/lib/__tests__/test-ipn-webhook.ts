/**
 * Test script for SePay IPN webhook handler
 *
 * This script simulates IPN payloads to test the webhook endpoint
 */

import { SepayIpnPayload } from '@/types/sepay-ipn'

// Mock IPN payloads for testing
export const mockIpnPayloads: Record<string, SepayIpnPayload> = {
  successfulPayment: {
    order_invoice_number: 'INV-1234567890-ABC123',
    sepay_order_id: 'SP-987654321',
    status: 'ORDER_PAID',
    amount: 299000,
    payment_method: 'BANK_TRANSFER',
    transaction_time: '2025-01-23T10:30:00Z',
    signature: 'mock-signature-success',
    custom_data: {
      buyer_name: 'John Doe',
      buyer_email: 'john@example.com',
      buyer_phone: '+84912345678',
    },
  },

  failedPayment: {
    order_invoice_number: 'INV-1234567891-DEF456',
    sepay_order_id: 'SP-987654322',
    status: 'ORDER_FAILED',
    amount: 199000,
    payment_method: 'CARD',
    transaction_time: '2025-01-23T11:00:00Z',
    signature: 'mock-signature-failed',
  },

  pendingPayment: {
    order_invoice_number: 'INV-1234567892-GHI789',
    sepay_order_id: 'SP-987654323',
    status: 'ORDER_PENDING',
    amount: 399000,
    payment_method: 'NAPAS_BANK_TRANSFER',
    transaction_time: '2025-01-23T11:15:00Z',
    signature: 'mock-signature-pending',
  },

  // Invalid payload for testing error cases
  missingFields: {
    order_invoice_number: 'INV-1234567893-JKL012',
    sepay_order_id: 'SP-987654324',
    // Missing status, amount, payment_method, etc.
    signature: 'mock-signature-invalid',
  } as SepayIpnPayload,

  amountMismatch: {
    order_invoice_number: 'INV-1234567894-MNO345',
    sepay_order_id: 'SP-987654325',
    status: 'ORDER_PAID',
    amount: 100000, // Wrong amount
    payment_method: 'BANK_TRANSFER',
    transaction_time: '2025-01-23T12:00:00Z',
    signature: 'mock-signature-mismatch',
  },
}

/**
 * Test function to send IPN payload to webhook endpoint
 */
export async function testIpnWebhook(
  payload: SepayIpnPayload,
  baseUrl: string = 'http://localhost:3000'
): Promise<Response> {
  const url = `${baseUrl}/api/payment/ipn`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-sepay-signature': payload.signature,
    },
    body: JSON.stringify(payload),
  })

  return response
}

/**
 * Run all test cases
 */
export async function runIpnTests(baseUrl: string = 'http://localhost:3000') {
  console.log('🧪 Testing SePay IPN Webhook Handler\n')

  const testCases = [
    { name: 'Successful Payment', payload: mockIpnPayloads.successfulPayment },
    { name: 'Failed Payment', payload: mockIpnPayloads.failedPayment },
    { name: 'Pending Payment', payload: mockIpnPayloads.pendingPayment },
    { name: 'Missing Fields', payload: mockIpnPayloads.missingFields },
    { name: 'Amount Mismatch', payload: mockIpnPayloads.amountMismatch },
  ]

  for (const testCase of testCases) {
    console.log(`📤 Testing: ${testCase.name}`)

    try {
      const response = await testIpnWebhook(testCase.payload, baseUrl)
      const result = await response.json()

      console.log(`   Status: ${response.status}`)
      console.log(`   Response:`, result)

      if (response.ok) {
        console.log('   ✅ Success')
      } else {
        console.log('   ❌ Failed')
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error}`)
    }

    console.log('')
  }
}

// Export for use in test files
export { mockIpnPayloads as default }
