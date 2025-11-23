# SePay SDK Client Wrapper

This module provides a TypeScript wrapper around the `sepay-pg-node` SDK with additional utility functions for payment processing, checkout URL generation, and webhook validation.

## Installation

The SDK wrapper is already included in the project. Make sure you have the required environment variables configured:

```bash
# Required environment variables
SEPAY_ENV=sandbox                    # or 'production'
SEPAY_MERCHANT_ID=your_merchant_id
SEPAY_SECRET_KEY=your_secret_key

# Optional but recommended
SEPAY_WEBHOOK_SECRET=your_webhook_secret
```

## Features

- ✅ Singleton SDK client instance
- ✅ Environment variable validation
- ✅ TypeScript type safety
- ✅ Checkout URL generation
- ✅ Checkout form fields creation
- ✅ Invoice number generation
- ✅ Webhook signature validation
- ✅ Comprehensive error handling
- ✅ Full test coverage

## Usage Examples

### Basic Setup

```typescript
import { isConfigured, getClient } from '@/lib/sepay-sdk'

// Check if SDK is properly configured
if (!isConfigured()) {
  console.error('SePay SDK is not configured')
  return
}

// Get the SDK client instance
const client = getClient()
```

### Generate Invoice Number

```typescript
import { generateInvoiceNumber } from '@/lib/sepay-sdk'

// Default format: INV-{timestamp}-{random}
const invoiceNumber = generateInvoiceNumber()
// Example: INV-1737648200000-ABC123

// Custom format
const customInvoice = generateInvoiceNumber({
  prefix: 'ORDER',
  separator: '_',
})
// Example: ORDER_1737648200000_ABC123
```

### Create Checkout Fields

```typescript
import { createCheckoutFields, getCheckoutUrl } from '@/lib/sepay-sdk'

const checkoutParams = {
  payment_method: 'BANK_TRANSFER', // 'BANK_TRANSFER' | 'CARD' | 'NAPAS_BANK_TRANSFER'
  order_invoice_number: 'INV-1737648200000-ABC123',
  order_amount: 299000, // Amount in VND
  currency: 'VND',
  order_description: 'AI4CHILL ChatGPT Plus Subscription',
  success_url: 'https://yourdomain.com/payment/success',
  error_url: 'https://yourdomain.com/payment/error',
  cancel_url: 'https://yourdomain.com/payment/cancel',
  buyer_name: 'John Doe', // Optional
  buyer_email: 'john@example.com', // Optional
  buyer_phone: '0123456789', // Optional
}

try {
  const checkoutFields = createCheckoutFields(checkoutParams)
  const checkoutUrl = getCheckoutUrl()

  console.log('Checkout URL:', checkoutUrl)
  console.log('Checkout Fields:', checkoutFields)

  // Use these fields to create a payment form or redirect user
} catch (error) {
  console.error('Failed to create checkout:', error)
}
```

### Payment Form Example

```html
<form action="{checkoutUrl}" method="POST">
  <!-- Hidden fields from SDK -->
  <input type="hidden" name="signature" value="{checkoutFields.signature}" />
  <input type="hidden" name="merchant" value="{checkoutFields.merchant}" />
  <input type="hidden" name="operation" value="{checkoutFields.operation}" />
  <input
    type="hidden"
    name="payment_method"
    value="{checkoutFields.payment_method}"
  />
  <input
    type="hidden"
    name="order_invoice_number"
    value="{checkoutFields.order_invoice_number}"
  />
  <input
    type="hidden"
    name="order_amount"
    value="{checkoutFields.order_amount}"
  />
  <input type="hidden" name="currency" value="{checkoutFields.currency}" />
  <input
    type="hidden"
    name="order_description"
    value="{checkoutFields.order_description}"
  />
  <input
    type="hidden"
    name="success_url"
    value="{checkoutFields.success_url}"
  />
  <input type="hidden" name="error_url" value="{checkoutFields.error_url}" />
  <input type="hidden" name="cancel_url" value="{checkoutFields.cancel_url}" />
  <input
    type="hidden"
    name="custom_data"
    value="{checkoutFields.custom_data}"
  />

  <!-- Submit button -->
  <button type="submit">Pay Now</button>
</form>
```

### Webhook Signature Validation

```typescript
import { validateIpnSignature } from '@/lib/sepay-sdk'

// In your webhook handler
export async function POST(request: Request) {
  const payload = await request.json()
  const signature = request.headers.get('x-sepay-signature')

  if (!validateIpnSignature(payload, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Process valid webhook
  // ...
}
```

## API Reference

### Functions

#### `getCheckoutUrl(): string`

Returns the checkout URL for the SePay payment gateway.

#### `createCheckoutFields(params: CheckoutParams): CheckoutFields`

Creates checkout form fields with the provided parameters.

**Parameters:**

- `payment_method`: Payment method ('BANK_TRANSFER', 'CARD', 'NAPAS_BANK_TRANSFER')
- `order_invoice_number`: Unique invoice number
- `order_amount`: Payment amount in VND (must be > 0)
- `currency`: Currency code (only 'VND' supported)
- `order_description`: Order description
- `success_url`: Absolute URL for successful payment
- `error_url`: Absolute URL for failed payment
- `cancel_url`: Absolute URL for cancelled payment
- `buyer_name`: Optional buyer name
- `buyer_email`: Optional buyer email
- `buyer_phone`: Optional buyer phone

#### `generateInvoiceNumber(options?: InvoiceNumberOptions): string`

Generates a unique invoice number.

**Options:**

- `prefix`: Prefix for invoice number (default: 'INV')
- `separator`: Separator between parts (default: '-')

#### `validateIpnSignature(payload: any, signature?: string): boolean`

Validates IPN webhook signature using HMAC-SHA256.

#### `isConfigured(): boolean`

Checks if all required environment variables are set.

#### `getClient(): SePayPgClient`

Returns the underlying SePay SDK client instance.

#### `resetClient(): void`

Resets the singleton client instance (useful for testing).

### Types

```typescript
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
```

## Error Handling

All functions throw descriptive errors for common issues:

- Missing required environment variables
- Invalid parameters (amount, URLs, currency)
- SDK initialization failures
- Network or API errors

Always wrap SDK calls in try-catch blocks:

```typescript
try {
  const fields = createCheckoutFields(params)
  // Process fields
} catch (error) {
  if (error instanceof Error) {
    console.error('SDK Error:', error.message)
    // Handle error appropriately
  }
}
```

## Testing

The SDK wrapper includes comprehensive tests. Run them with:

```bash
npm test src/lib/__tests__/sepay-sdk.test.ts
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive credentials to version control
2. **Webhook Validation**: Always validate webhook signatures
3. **HTTPS**: Always use HTTPS URLs for payment callbacks
4. **Amount Validation**: SDK validates amounts to prevent negative values
5. **URL Validation**: All callback URLs are validated to be absolute URLs

## Migration from Legacy Sepay Integration

If you're migrating from the legacy Sepay integration (`src/lib/sepay.ts`), here are the key differences:

| Feature              | Legacy (`sepay.ts`)       | New (`sepay-sdk.ts`)                 |
| -------------------- | ------------------------- | ------------------------------------ |
| SDK                  | Manual QR code generation | Official sepay-pg-node SDK           |
| Payment Methods      | Bank transfer only        | Multiple methods (Bank, Card, NAPAS) |
| Signature Validation | Basic HMAC                | Enhanced validation                  |
| Type Safety          | Basic interfaces          | Full TypeScript support              |
| Error Handling       | Basic                     | Comprehensive                        |
| Testing              | Limited                   | Full test coverage                   |

## Support

For issues related to:

- **SDK Wrapper**: Check this documentation and run tests
- **SePay Gateway**: Refer to [SePay Documentation](https://sepay.vn)
- **sepay-pg-node SDK**: Check the [SDK Documentation](https://npmjs.com/package/sepay-pg-node)
