# Sepay Payment Integration

This document describes the Sepay payment gateway integration for AI4CHILL.

## Overview

Sepay is a Vietnamese payment gateway that uses QR codes for payment. Customers scan QR codes with their banking apps to complete payments.

## Payment Flow

1. **Order Creation**: Customer adds products to cart and checks out
2. **QR Generation**: Server creates order and generates Sepay QR URL
3. **Payment**: Customer scans QR code and pays with their banking app
4. **Webhook Notification**: Sepay sends webhook to our server confirming payment
5. **Order Update**: Server validates webhook and updates order status to PAID
6. **Transaction Record**: A transaction record is created for audit trail

## Components

### 1. Sepay Utility (`/src/lib/sepay.ts`)

Core utility functions for Sepay integration:

- `generateQRUrl(orderId, amount)` - Generate QR code URL
- `validateWebhookSignature(payload, signature)` - Validate webhook authenticity
- `extractOrderIdFromDescription(description)` - Extract order ID from transaction description
- `validateWebhookPayload(payload)` - Validate webhook payload structure
- `isAllowedIP(ip)` - Check if IP is in whitelist
- `generateTransactionReference(payload)` - Generate unique reference for idempotency

### 2. Database Schema

#### Transaction Model

```prisma
model Transaction {
  id          String   @id @default(cuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  amount      Decimal  @db.Decimal(10, 2)
  status      String   // SUCCESS, FAILED, PENDING
  provider    String   // SEPAY
  gatewayData Json?    // Raw webhook payload
  reference   String?  // Unique transaction reference for idempotency
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### Order Status Updates

- `PENDING` → `PAID` (when webhook confirms successful payment)
- `PAID` → `PROCESSING` → `SHIPPED` → `DELIVERED` (manual admin actions)

### 3. Order Creation (`/src/app/actions/create-order.ts`)

Server action to create orders with Sepay integration:

```typescript
const result = await createOrder({
  userId: 'user_id',
  items: [{ variantId: 'variant_id', quantity: 1 }],
})

// Returns:
// {
//   success: true,
//   orderId: 'order_id',
//   qrUrl: 'https://qr.sepay.vn/img?acc=...',
//   totalAmount: 99000
// }
```

### 4. Webhook Handler (`/src/app/api/webhooks/sepay/route.ts`)

API endpoint to receive Sepay webhooks:

- **Security**: IP whitelist, signature validation, payload validation
- **Idempotency**: Prevents duplicate processing using transaction reference
- **Validation**: Amount matching, order status checks
- **Atomicity**: Uses database transactions for consistency

## Environment Variables

Add these to your `.env` file:

```bash
# Sepay Account Information
SEPAY_ACCOUNT_NUMBER="your_account_number"
SEPAY_ACCOUNT_NAME="Your Business Name"
SEPAY_BANK_CODE="MB"  # MB Bank, VCB, TCB, etc.

# Webhook Security (Optional but recommended)
SEPAY_WEBHOOK_SECRET="your_webhook_secret_key"
SEPAY_ALLOWED_IPS="103.56.158.0/24,103.57.240.0/24"
```

## QR Code URL Format

```
https://qr.sepay.vn/img?acc={ACCOUNT_NUMBER}&amount={AMOUNT}&des={DESCRIPTION}&name={ACCOUNT_NAME}&bank={BANK_CODE}
```

Example:

```
https://qr.sepay.vn/img?acc=1234567890&amount=99000&des=AI4CHILL%20ord_abc123&name=AI4CHILL&bank=MB
```

## Webhook Payload Format

```json
{
  "id": "txn_123456",
  "gateway": "SEPAY",
  "transactionDate": "2025-01-20T10:30:00Z",
  "accountNumber": "1234567890",
  "amount": 99000,
  "content": "AI4CHILL ord_abc123",
  "referenceCode": "REF123",
  "description": "ord_abc123"
}
```

## Testing

### 1. Create Test Data

```bash
npm run create-test-data
```

This creates:

- Test user (test@example.com)
- Test product with variants
- Stock for variants

### 2. Test Payment Flow

```bash
npm run test-sepay
```

This simulates:

- Order creation
- QR URL generation
- Webhook processing
- Order status update

### 3. Manual Webhook Testing

Use the test endpoint to simulate webhooks:

```bash
curl -X POST http://localhost:3000/api/test/sepay-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "your_order_id",
    "amount": 99000,
    "status": "SUCCESS"
  }'
```

## Security Considerations

1. **IP Whitelist**: Only allow webhooks from Sepay's IP addresses
2. **Signature Validation**: Validate webhook signatures if provided
3. **Amount Validation**: Verify payment amount matches order total
4. **Idempotency**: Prevent duplicate transaction processing
5. **Status Checks**: Only update PENDING orders
6. **Rate Limiting**: Consider rate limiting webhook endpoint

## Error Handling

### Common Errors

- **Order not found**: Invalid order ID in webhook
- **Amount mismatch**: Payment amount doesn't match order total
- **Invalid status**: Order is not in PENDING status
- **Duplicate transaction**: Transaction already processed
- **Unauthorized**: IP not in whitelist

### Logging

All webhook events are logged with:

- Transaction ID
- Order ID
- Amount
- Status
- Error details (if any)

## Monitoring

Monitor these metrics:

- Webhook success rate
- Order conversion rate (PENDING → PAID)
- Transaction processing time
- Error rates by type

## Troubleshooting

### Webhook Not Received

1. Check Sepay webhook configuration
2. Verify webhook URL is accessible
3. Check IP whitelist configuration
4. Review server logs

### Order Not Updated

1. Check webhook payload format
2. Verify order ID extraction
3. Validate amount matching
4. Review transaction logs

### Duplicate Transactions

1. Check transaction reference generation
2. Verify idempotency logic
3. Review webhook retry behavior

## Future Enhancements

1. **Email Notifications**: Send payment confirmation emails (Task #9)
2. **Refund Support**: Handle refund webhooks
3. **Multiple Payment Methods**: Support other payment gateways
4. **Analytics**: Payment analytics and reporting
5. **Webhook Retry**: Implement retry mechanism for failed webhooks
