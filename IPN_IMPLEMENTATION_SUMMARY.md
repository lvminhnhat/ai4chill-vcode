# SePay IPN Webhook Implementation

## 📋 Overview

Đã implement thành công IPN (Instant Payment Notification) webhook handler cho SePay payment gateway tại `/api/payment/ipn`.

## 📁 Files Created/Modified

### 1. Core Implementation

- **`src/app/api/payment/ipn/route.ts`** - Main IPN webhook handler
- **`src/types/sepay-ipn.ts`** - TypeScript type definitions for IPN payload

### 2. Testing & Documentation

- **`src/lib/__tests__/test-ipn-webhook.ts`** - Test utilities and mock payloads
- **`src/app/api/payment/ipn/__tests__/route.test.ts`** - Unit tests for IPN handler
- **`scripts/test-ipn-webhook.js`** - Script to test webhook locally
- **`docs/IPN_WEBHOOK.md`** - Complete documentation

### 3. Configuration

- **`package.json`** - Added `test:ipn` script

## ✅ Features Implemented

### 🔐 Security Validations

- **Signature Validation**: HMAC-SHA256 using `SEPAY_WEBHOOK_SECRET`
- **Amount Validation**: Matches order total (±100 VND tolerance)
- **Required Fields Validation**: All mandatory IPN fields checked
- **Idempotency**: Prevents duplicate processing using unique transaction reference

### 📊 Status Mapping

| SePay Status     | Order Status | Transaction Status |
| ---------------- | ------------ | ------------------ |
| ORDER_PAID       | CONFIRMED    | SUCCESS            |
| ORDER_FAILED     | CANCELLED    | FAILED             |
| ORDER_PENDING    | PENDING      | PENDING            |
| ORDER_PROCESSING | PROCESSING   | PENDING            |
| ORDER_CANCELLED  | CANCELLED    | FAILED             |

### 🔄 Processing Flow

1. Validate signature and payload structure
2. Find order by invoice number
3. Validate payment amount
4. Check for duplicate transactions
5. Process payment atomically (Prisma transaction)
6. Update order status and create transaction record
7. Log all activities for debugging

### 📝 Error Handling

- **400**: Bad request (invalid JSON, missing fields, amount mismatch)
- **401**: Invalid signature
- **404**: Order not found
- **500**: Internal server error
- **200**: Success or already processed (idempotent)

## 🧪 Testing

### Unit Tests

```bash
npm test -- src/app/api/payment/ipn/__tests__/route.test.ts
```

### Integration Testing

```bash
# Start development server
npm run dev

# Run IPN webhook tests
npm run test:ipn

# Test with custom URL
npm run test:ipn -- --url http://localhost:3001
```

### Manual Testing

```typescript
import {
  testIpnWebhook,
  mockIpnPayloads,
} from '@/lib/__tests__/test-ipn-webhook'

// Test successful payment
const response = await testIpnWebhook(mockIpnPayloads.successfulPayment)
console.log(await response.json())
```

## 🔧 Configuration

### Required Environment Variables

```env
SEPAY_WEBHOOK_SECRET=your_webhook_secret_key
DATABASE_URL=your_database_url
```

### Optional Environment Variables

```env
SEPAY_ALLOWED_IPS=103.56.158.0/24,103.57.240.0/24  # IP whitelist
```

## 📊 Database Schema

### Transaction Model Updates

```prisma
model Transaction {
  id           String   @id @default(cuid())
  orderId      String
  amount       Decimal  @db.Decimal(10, 2)
  status       String   // SUCCESS, FAILED, PENDING
  provider     String   // SEPAY
  sepayOrderId String?  // SePay's internal order ID
  paymentMethod String? // BANK_TRANSFER, CARD, NAPAS_BANK_TRANSFER
  gatewayData  Json?    // Raw IPN payload
  reference    String?  // Unique transaction reference for idempotency
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## 🚀 Deployment Notes

### Production Checklist

- [ ] Configure `SEPAY_WEBHOOK_SECRET` in production
- [ ] Set up IP whitelist for SePay servers
- [ ] Enable HTTPS for webhook endpoint
- [ ] Configure monitoring and alerting
- [ ] Test with production SePay endpoints

### Monitoring

- Monitor logs for processing errors
- Track transaction reference uniqueness
- Alert on repeated signature validation failures
- Monitor order status change patterns

## 🔍 Debugging

### Common Issues

1. **Invalid Signature**: Check `SEPAY_WEBHOOK_SECRET` configuration
2. **Order Not Found**: Verify invoice number format and existence
3. **Amount Mismatch**: Check currency and decimal precision
4. **Duplicate Processing**: Review transaction reference generation

### Debug Mode

Add test header to bypass some validations:

```
x-test-webhook: true
```

## 📚 Documentation

- **Complete API Documentation**: `docs/IPN_WEBHOOK.md`
- **Type Definitions**: `src/types/sepay-ipn.ts`
- **Test Examples**: `src/lib/__tests__/test-ipn-webhook.ts`

## 🎯 Next Steps

1. **Email Notifications**: Implement confirmation emails for successful payments
2. **Fulfillment Integration**: Trigger fulfillment process for confirmed orders
3. **Analytics**: Add payment success/failure tracking
4. **Webhook Retry**: Implement retry mechanism for failed webhooks
5. **Admin Dashboard**: Add webhook monitoring interface

## 🤝 Integration with Existing System

IPN webhook integrates seamlessly with:

- **Order Management**: Updates order status automatically
- **Transaction Records**: Creates comprehensive payment history
- **User Notifications**: Foundation for email/SMS notifications
- **Inventory System**: Ready for fulfillment integration

---

**Status**: ✅ Complete and Tested  
**Issue**: #30 - Phase 2.3  
**Ready for Production**: Yes (with proper configuration)
