# SePay IPN Webhook Documentation

## Overview

The IPN (Instant Payment Notification) webhook at `/api/payment/ipn` receives real-time payment notifications from SePay when payment status changes occur.

## Endpoint

```
POST /api/payment/ipn
```

## Security

### Signature Validation

The webhook validates incoming requests using HMAC-SHA256 signature:

- **Header**: `x-sepay-signature` or `signature`
- **Secret**: `SEPAY_WEBHOOK_SECRET` environment variable
- **Method**: HMAC-SHA256 of the JSON payload

### IP Whitelisting

Consider implementing IP whitelisting for production environments (SePay's IP ranges).

## Payload Structure

```typescript
interface SepayIpnPayload {
  order_invoice_number: string // Your invoice number
  sepay_order_id: string // SePay's internal order ID
  status: string // Payment status
  amount: number // Payment amount in VND
  payment_method: string // BANK_TRANSFER, CARD, NAPAS_BANK_TRANSFER
  transaction_time: string // ISO 8601 timestamp
  signature: string // Request signature
  custom_data?: any // Optional buyer information
}
```

## Status Mapping

### SePay Status → Order Status

| SePay Status     | Order Status | Transaction Status |
| ---------------- | ------------ | ------------------ |
| ORDER_PAID       | CONFIRMED    | SUCCESS            |
| ORDER_FAILED     | CANCELLED    | FAILED             |
| ORDER_PENDING    | PENDING      | PENDING            |
| ORDER_PROCESSING | PROCESSING   | PENDING            |
| ORDER_CANCELLED  | CANCELLED    | FAILED             |

## Processing Flow

1. **Validate Request**
   - Check required fields
   - Validate signature
   - Parse JSON payload

2. **Find Order**
   - Lookup by `order_invoice_number`
   - Return 404 if not found

3. **Validate Amount**
   - Compare with order total
   - Allow ±100 VND tolerance
   - Return 400 if mismatch

4. **Check Idempotency**
   - Generate unique reference: `IPN-{sepay_order_id}-{transaction_time}`
   - Check if transaction already processed
   - Return 200 if duplicate

5. **Process Transaction**
   - Update order status
   - Create/update transaction record
   - Store full payload in `gatewayData`

6. **Return Response**
   - 200 OK with success details
   - Appropriate error codes for failures

## Error Handling

| Status Code | Description                                                 |
| ----------- | ----------------------------------------------------------- |
| 200         | Success or already processed                                |
| 400         | Bad request (invalid JSON, missing fields, amount mismatch) |
| 401         | Invalid signature                                           |
| 404         | Order not found                                             |
| 500         | Internal server error                                       |

## Idempotency

The webhook ensures idempotent processing:

- Each IPN generates a unique transaction reference
- Duplicate requests are detected and ignored
- Order status is only updated once per unique transaction

## Logging

All webhook requests are logged with:

- Request details (invoice, order ID, status, amount)
- Validation results
- Processing errors
- Transaction outcomes

## Testing

Use the test utilities in `src/lib/__tests__/test-ipn-webhook.ts`:

```typescript
import { runIpnTests, mockIpnPayloads } from '@/lib/__tests__/test-ipn-webhook'

// Run all test cases
await runIpnTests('http://localhost:3000')

// Test specific payload
const response = await testIpnWebhook(mockIpnPayloads.successfulPayment)
```

## Environment Variables

Required:

```env
SEPAY_WEBHOOK_SECRET=your_webhook_secret_key
DATABASE_URL=your_database_url
```

## Monitoring

Monitor webhook health by:

1. Checking logs for processing errors
2. Monitoring transaction reference uniqueness
3. Tracking order status changes
4. Alerting on repeated failures

## Security Best Practices

1. **Always validate signatures** before processing
2. **Use HTTPS** in production
3. **Implement rate limiting** to prevent abuse
4. **Log all requests** for audit trails
5. **Monitor for duplicate processing**
6. **Set up alerts** for failed validations

## Troubleshooting

### Common Issues

1. **Invalid Signature**
   - Check `SEPAY_WEBHOOK_SECRET` configuration
   - Verify signature extraction from headers
   - Ensure JSON payload matches exactly

2. **Order Not Found**
   - Verify `order_invoice_number` format
   - Check order exists in database
   - Confirm invoice number uniqueness

3. **Amount Mismatch**
   - Verify currency (VND only)
   - Check for decimal precision issues
   - Confirm tolerance threshold (±100 VND)

4. **Duplicate Processing**
   - Check transaction reference generation
   - Verify database uniqueness constraints
   - Review idempotency logic

### Debug Mode

Add test header to bypass some validations:

```
x-test-webhook: true
```

This is useful for development and testing environments.
