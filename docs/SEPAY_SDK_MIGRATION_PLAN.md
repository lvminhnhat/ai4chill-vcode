# SePay SDK Migration Plan

## Executive Summary

Migration from custom QR code implementation to official SePay SDK (`sepay-pg-node`) for enhanced payment capabilities and better security.

**Estimated Effort:** 40-56 hours over 4 weeks  
**Risk Level:** Medium  
**Business Impact:** High (enables multiple payment methods)

---

## Current vs New Implementation

### Current (Custom QR Code)

- ✅ Simple QR code generation
- ✅ Basic webhook handling
- ❌ Limited to single payment method
- ❌ Manual signature validation
- ❌ Polling-based status checking
- ❌ No official support

### New (Official SDK)

- ✅ Multiple payment methods (Bank Transfer, Card, NAPAS QR)
- ✅ Automatic signature generation
- ✅ Professional checkout form
- ✅ IPN (Instant Payment Notification)
- ✅ Official SDK support and updates
- ✅ Production-ready security

---

## Migration Strategy

### Phase 1: Preparation (Week 1)

1. Install `sepay-pg-node` SDK
2. Register SePay sandbox account
3. Configure environment variables
4. Update database schema

### Phase 2: Implementation (Week 2)

1. Create SDK client wrapper
2. Build checkout form component
3. Implement IPN webhook handler
4. Create callback pages (success/error/cancel)
5. Update order creation flow

### Phase 3: Testing (Week 3)

1. Unit tests for all new components
2. Integration tests for payment flow
3. Sandbox manual testing
4. Security validation

### Phase 4: Deployment (Week 4)

1. Staging deployment
2. Production soft launch (10% traffic)
3. Gradual rollout to 100%
4. Monitor and optimize

---

## Key Changes

### 1. Files to Modify

**src/lib/sepay.ts**

- Add SDK client initialization
- Replace custom QR generation with SDK methods
- Update webhook validation for IPN format

**src/app/actions/create-order.ts**

- Add payment method parameter
- Generate invoice number
- Return checkout form fields instead of QR URL

**src/app/api/webhooks/sepay/route.ts**

- Update to handle IPN payload structure
- Support ORDER_PAID, ORDER_FAILED notifications
- Update transaction processing

**prisma/schema.prisma**

- Add `invoiceNumber` to Order (unique)
- Add `paymentMethod` to Order
- Add `sepayOrderId` to Transaction

### 2. New Files to Create

```
src/
├── lib/
│   └── sepay-client.ts          # SDK initialization
├── types/
│   └── sepay.ts                 # TypeScript types
├── components/
│   └── checkout/
│       └── CheckoutForm.tsx     # Payment form component
├── app/
│   ├── payment/
│   │   ├── success/page.tsx     # Success callback
│   │   ├── error/page.tsx       # Error callback
│   │   └── cancel/page.tsx      # Cancel callback
│   ├── api/
│   │   └── payment/
│   │       └── ipn/route.ts     # IPN webhook handler
│   └── actions/
│       └── checkout-actions.ts  # Checkout server actions
└── utils/
    └── invoice-generator.ts     # Invoice number generator
```

### 3. Environment Variables

**New Required:**

```env
SEPAY_MERCHANT_ID=your_merchant_id
SEPAY_SECRET_KEY=your_secret_key
SEPAY_ENV=sandbox  # or production
SEPAY_IPN_URL=https://yourdomain.com/api/payment/ipn
```

**New Optional:**

```env
NEXT_PUBLIC_SUCCESS_URL=/payment/success
NEXT_PUBLIC_ERROR_URL=/payment/error
NEXT_PUBLIC_CANCEL_URL=/payment/cancel
```

**Deprecated:**

```env
SEPAY_ACCOUNT_NUMBER  # Replaced by MERCHANT_ID
SEPAY_ACCOUNT_NAME    # Replaced by MERCHANT_ID
SEPAY_BANK_CODE       # Handled by SDK
```

---

## Payment Flow Comparison

### Old Flow (QR Code)

```
1. User creates order
2. System generates QR code URL
3. Display QR code on page
4. User scans and pays
5. Frontend polls every 10s for status
6. Webhook updates order status
7. Frontend detects status change
```

### New Flow (Checkout Form)

```
1. User creates order
2. System generates checkout form with signed fields
3. Form auto-submits to SePay gateway (POST)
4. User completes payment on SePay platform
5. SePay redirects to success/error/cancel URL
6. SePay sends IPN to backend immediately
7. Backend updates order status
8. User sees result page
```

---

## Integration Steps

### Step 1: Install SDK

```bash
npm install sepay-pg-node
```

### Step 2: Register Sandbox Account

1. Visit https://my.sepay.vn/register
2. Navigate to Cổng thanh toán > Đăng ký
3. Select "Quét mã QR chuyển khoản ngân hàng" > Bắt đầu ngay
4. Choose Sandbox mode
5. Copy MERCHANT_ID and SECRET_KEY

### Step 3: Configure IPN

1. In SePay dashboard, set IPN URL
2. For local dev: Use ngrok to expose localhost
   ```bash
   ngrok http 3000
   # Use ngrok URL + /api/payment/ipn
   ```

### Step 4: Database Migration

```bash
npx prisma migrate dev --name add_sepay_sdk_fields
npx prisma generate
```

### Step 5: Create SDK Client

```typescript
// src/lib/sepay-client.ts
import { SePayPgClient } from 'sepay-pg-node'

export const getSepayClient = () => {
  return new SePayPgClient({
    env: process.env.SEPAY_ENV as 'sandbox' | 'production',
    merchant_id: process.env.SEPAY_MERCHANT_ID!,
    secret_key: process.env.SEPAY_SECRET_KEY!,
  })
}
```

### Step 6: Implement IPN Handler

```typescript
// src/app/api/payment/ipn/route.ts
export async function POST(request: NextRequest) {
  const data = await request.json()

  if (data.notification_type === 'ORDER_PAID') {
    // Update order status to PAID
    // Create transaction record
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
```

### Step 7: Create Checkout Form

```typescript
// Generate form fields
const client = getSepayClient();
const formFields = client.checkout.initOneTimePaymentFields({
  operation: 'PURCHASE',
  payment_method: 'BANK_TRANSFER',
  order_invoice_number: invoiceNumber,
  order_amount: amount,
  currency: 'VND',
  success_url: 'https://yourdomain.com/payment/success',
  error_url: 'https://yourdomain.com/payment/error',
  cancel_url: 'https://yourdomain.com/payment/cancel',
});

// In component: Auto-submit form
<form action={client.checkout.initCheckoutUrl()} method="POST">
  {Object.entries(formFields).map(([key, value]) => (
    <input type="hidden" name={key} value={value} key={key} />
  ))}
  <button type="submit">Thanh toán</button>
</form>
```

---

## Testing Plan

### Sandbox Testing Checklist

- [ ] Create order with BANK_TRANSFER method
- [ ] Form submits to SePay sandbox successfully
- [ ] Complete mock payment on SePay platform
- [ ] Redirected to success URL
- [ ] IPN received and processed
- [ ] Order status updated to PAID
- [ ] Transaction record created
- [ ] Test payment cancellation
- [ ] Test payment error
- [ ] Test duplicate IPN (idempotency)
- [ ] Test invalid signature rejection
- [ ] Test IP whitelist (if configured)

### Performance Testing

- [ ] Checkout form loads < 2 seconds
- [ ] IPN processing < 1 second
- [ ] Database queries < 100ms
- [ ] Handle 100+ concurrent orders
- [ ] No duplicate transactions

### Security Testing

- [ ] IPN signature validation works
- [ ] Invalid signatures rejected
- [ ] IP whitelist enforced
- [ ] No sensitive data in logs
- [ ] HTTPS enforced

---

## Risk Mitigation

### High Priority Risks

**1. Breaking Changes to Payment Flow**

- **Mitigation:** Feature flag for gradual rollout
- **Rollback:** Keep old flow available
- **Testing:** Comprehensive sandbox testing

**2. Invoice Number Collision**

- **Mitigation:** UUID-based generation + unique DB constraint
- **Monitoring:** Log all invoice generations
- **Retry:** Auto-retry on collision

**3. IPN Endpoint Not Accessible**

- **Mitigation:** Use ngrok for local dev
- **Documentation:** Clear setup guide
- **Testing:** Mock IPN test script

### Medium Priority Risks

**4. Environment Variable Mismatch**

- **Mitigation:** Validation on startup
- **Documentation:** Clear .env.example
- **Separation:** Different credentials for sandbox/prod

**5. User Confusion with New Flow**

- **Mitigation:** Clear UI instructions
- **Support:** User guide documentation
- **Rollout:** Gradual adoption

---

## Success Criteria

### Functional

- ✅ All payment methods work correctly
- ✅ IPN processes notifications automatically
- ✅ Order status updates in real-time
- ✅ Callback URLs redirect properly
- ✅ No duplicate transactions

### Performance

- ✅ Checkout form loads < 2s
- ✅ IPN processing < 1s
- ✅ Payment success rate > 95%

### Business

- ✅ Zero revenue loss during migration
- ✅ Support multiple payment methods
- ✅ Better user experience
- ✅ Production-ready security

---

## Timeline

| Week | Phase       | Activities                        |
| ---- | ----------- | --------------------------------- |
| 1    | Development | SDK setup, backend implementation |
| 2    | Development | Frontend components, testing      |
| 3    | Testing     | Sandbox testing, bug fixes        |
| 4    | Deployment  | Staging, soft launch, monitoring  |

---

## Go-Live Checklist

### Pre-Production

- [ ] All sandbox tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Production credentials obtained
- [ ] IPN URL configured in SePay dashboard
- [ ] Callback URLs configured
- [ ] Monitoring/alerts set up
- [ ] Rollback plan documented

### Production Launch

- [ ] Deploy with feature flag disabled
- [ ] Smoke test production environment
- [ ] Enable for 10% of users
- [ ] Monitor for 24 hours
- [ ] Gradually increase to 100%
- [ ] Monitor payment success rate
- [ ] Verify IPN processing
- [ ] Check transaction records

### Post-Launch

- [ ] Monitor for 1 week
- [ ] Collect user feedback
- [ ] Address any issues
- [ ] Remove old flow (after 2 releases)
- [ ] Update documentation
- [ ] Team training complete

---

## Support & Resources

**SePay Documentation:**

- Getting Started: https://developer.sepay.vn/vi/cong-thanh-toan/bat-dau
- NodeJS SDK: https://developer.sepay.vn/vi/cong-thanh-toan/sdk/nodejs
- GitHub: https://github.com/sepayvn/sepay-pg-node

**Internal Documentation:**

- Migration Plan: `/docs/SEPAY_SDK_MIGRATION_PLAN.json`
- Integration Guide: `/docs/SEPAY_IMPLEMENTATION_SUMMARY.md`
- Payment Flow: `/docs/FULFILLMENT_FLOW.md`

**Support Contacts:**

- SePay Support: [Contact via dashboard]
- Development Team: [Your team contact]

---

## Appendix

### A. Database Schema Changes

```sql
-- Add invoice number to orders
ALTER TABLE orders ADD COLUMN invoice_number VARCHAR(255) UNIQUE;
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50);

-- Add SePay order ID to transactions
ALTER TABLE transactions ADD COLUMN sepay_order_id VARCHAR(255);

-- Add indexes
CREATE INDEX idx_orders_invoice_number ON orders(invoice_number);
CREATE INDEX idx_transactions_sepay_order_id ON transactions(sepay_order_id);
```

### B. IPN Payload Example

```json
{
  "timestamp": 1732345678,
  "notification_type": "ORDER_PAID",
  "order": {
    "id": "e2c195be-c721-47eb-b323-99ab24e52d85",
    "order_invoice_number": "INV-1732345678-ABC123",
    "order_status": "CAPTURED",
    "order_amount": "100000.00",
    "order_currency": "VND"
  },
  "transaction": {
    "id": "384c66dd-41e6-4316-a544-b4141682595c",
    "payment_method": "BANK_TRANSFER",
    "transaction_status": "APPROVED",
    "transaction_amount": "100000"
  }
}
```

### C. Invoice Number Format

```
Format: INV-{timestamp}-{random}
Example: INV-1732345678-A1B2C3
```

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-11-23  
**Status:** Ready for Implementation
