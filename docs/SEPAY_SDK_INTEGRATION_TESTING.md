# SePay SDK Integration Testing Guide

Hướng dẫn kiểm thử tích hợp SePay SDK trong môi trường sandbox để đảm bảo hệ thống hoạt động đúng trước khi triển khai production.

## 1. Điều Kiện Tiên Quyết (Prerequisites)

### 1.1 Tài Khoản SePay Sandbox

- Đăng ký tài khoản sandbox tại: [SePay Developer Portal](https://developer.sepay.vn)
- Lấy thông tin tài khoản test từ SePay docs:
  - Merchant ID
  - Secret Key
  - Tài khoản ngân hàng test
  - IP whitelist cho webhook

### 1.2 Cấu Hình Environment Variables

Copy và cấu hình file `.env` từ `.env.example`:

```bash
# SePay SDK Configuration
SEPAY_MERCHANT_ID=your_sandbox_merchant_id
SEPAY_SECRET_KEY=your_sandbox_secret_key
SEPAY_ENV=sandbox
SEPAY_IPN_URL=http://localhost:3000/api/payment/ipn

# SePay Account Info (Legacy - vẫn cần cho backward compatibility)
SEPAY_ACCOUNT_NUMBER=1234567890
SEPAY_ACCOUNT_NAME=AI4CHILL TEST
SEPAY_BANK_CODE=MB

# Webhook Security
SEPAY_WEBHOOK_SECRET=your_webhook_secret
SEPAY_ALLOWED_IPS="103.56.158.0/24,103.57.240.0/24"

# Database
DATABASE_URL=your_database_url

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 1.3 Thông Tin Tài Khoản Ngân Hàng Test

Từ SePay sandbox documentation:

```bash
# Test Bank Accounts
MB Bank: 9704198526192585 (Minh Nguyen)
VCB: 9704198526192585 (Tran Van A)
TCB: 9704198526192585 (Nguyen Van B)

# Test Amounts
- Thành công: 10000, 50000, 100000
- Thất bại: 99999, 123456
```

### 1.4 Chuẩn Bị Dữ Liệu Test

```bash
# Tạo dữ liệu test
npm run create-test-data

# Tạo dữ liệu fulfillment test
npm run create-fulfillment-test-data
```

## 2. Test Scenarios Checklist

### 2.1 Order Creation Tests

- [ ] **BANK_TRANSFER** - Tạo đơn hàng với chuyển khoản ngân hàng
- [ ] **CARD** - Tạo đơn hàng với thẻ tín dụng/ghi nợ
- [ ] **NAPAS_BANK_TRANSFER** - Tạo đơn hàng với Napas 24/7

### 2.2 Payment Flow Tests

- [ ] **Successful Payment** - Thanh toán thành công end-to-end
- [ ] **Failed Payment** - Thanh toán thất bại
- [ ] **Cancelled Payment** - Người dùng hủy thanh toán
- [ ] **Timeout Payment** - Hết thời gian thanh toán

### 2.3 Webhook Tests

- [ ] **IPN Signature Validation** - Xác thực chữ ký webhook
- [ ] **IPN Idempotency** - Xử lý duplicate notifications
- [ ] **Amount Mismatch Handling** - Xử lý số tiền không khớp
- [ ] **Invalid Order Handling** - Xử lý order không tồn tại
- [ ] **Malformed Payload** - Xử lý payload sai định dạng

### 2.4 UI/UX Tests

- [ ] **Callback Page Rendering** - Hiển thị trang callback thành công/lỗi
- [ ] **QR Code Generation** - Tạo QR code đúng
- [ ] **Payment Status Updates** - Cập nhật trạng thái real-time
- [ ] **Error Messages** - Hiển thị thông báo lỗi rõ ràng

## 3. Manual Testing Steps

### 3.1 Test Order Creation

#### 3.1.1 BANK_TRANSFER Method

1. **Login** vào hệ thống với tài khoản test
2. **Add products** vào giỏ hàng
3. **Proceed to checkout**
4. **Select payment method**: BANK_TRANSFER
5. **Verify response**:
   ```json
   {
     "success": true,
     "orderId": "ord_test_123",
     "qrUrl": "https://qr.sepay.vn/img?acc=...",
     "totalAmount": 99000
   }
   ```
6. **Check QR code** hiển thị đúng

#### 3.1.2 CARD Method

1. **Repeat steps 1-3** above
2. **Select payment method**: CARD
3. **Verify redirect** đến SePay payment page
4. **Check card form** hiển thị đúng

#### 3.1.3 NAPAS_BANK_TRANSFER Method

1. **Repeat steps 1-3** above
2. **Select payment method**: NAPAS_BANK_TRANSFER
3. **Verify bank selection** hiển thị
4. **Check redirect** đến bank gateway

### 3.2 Simulate Successful Payment

#### 3.2.1 Using SePay Sandbox Dashboard

1. **Login** vào SePay sandbox dashboard
2. **Find transaction** bằng order ID
3. **Mark as successful**
4. **Check webhook** được trigger

#### 3.2.2 Using Test Script

```bash
# Chạy script test IPN
npm run test:ipn

# Hoặc test thủ công
curl -X POST http://localhost:3000/api/payment/ipn \
  -H "Content-Type: application/json" \
  -H "X-SePay-Signature: test_signature" \
  -d '{
    "id": "txn_test_123",
    "gateway": "SEPAY",
    "transactionDate": "2025-01-20T10:30:00Z",
    "accountNumber": "9704198526192585",
    "amount": 99000,
    "content": "AI4CHILL ord_test_123",
    "referenceCode": "REF123",
    "description": "ord_test_123",
    "status": "SUCCESS"
  }'
```

### 3.3 Simulate Failed Payment

```bash
# Test failed payment
curl -X POST http://localhost:3000/api/payment/ipn \
  -H "Content-Type: application/json" \
  -d '{
    "id": "txn_test_456",
    "gateway": "SEPAY",
    "transactionDate": "2025-01-20T10:30:00Z",
    "accountNumber": "9704198526192585",
    "amount": 99000,
    "content": "AI4CHILL ord_test_456",
    "referenceCode": "REF456",
    "description": "ord_test_456",
    "status": "FAILED"
  }'
```

### 3.4 Test Webhook Locally with Ngrok

1. **Install ngrok**:

   ```bash
   npm install -g ngrok
   ```

2. **Start ngrok**:

   ```bash
   ngrok http 3000
   ```

3. **Update SePay webhook URL**:
   - Copy ngrok URL: `https://abc123.ngrok.io`
   - Set webhook: `https://abc123.ngrok.io/api/payment/ipn`

4. **Test webhook** từ SePay dashboard

## 4. Automated Testing

### 4.1 Available Test Scripts

#### 4.1.1 IPN Webhook Tests

```bash
# Run all IPN tests
npm run test:ipn

# Test with custom URL
npm run test:ipn -- --url https://your-app.vercel.app
```

**Expected Outputs**:

```
✅ Server is running
✅ Valid successful payment processed
✅ Valid failed payment processed
✅ Invalid signature rejected
✅ Duplicate request handled idempotently
✅ Amount mismatch rejected
✅ Invalid order handled
```

#### 4.1.2 SePay Integration Tests

```bash
# Run SePay SDK integration tests
npm run test-sepay
```

**Expected Outputs**:

```
✅ Order creation successful
✅ QR URL generated correctly
✅ Webhook processed successfully
✅ Order status updated to PAID
✅ Transaction record created
```

#### 4.1.3 Fulfillment Flow Tests

```bash
# Test fulfillment flow after payment
npm run test-fulfillment
```

### 4.2 Unit Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### 4.3 Verify Database Updates

Sau khi chạy tests, kiểm tra database:

```sql
-- Check orders
SELECT id, status, totalAmount, createdAt FROM orders WHERE id LIKE 'ord_test_%';

-- Check transactions
SELECT id, orderId, amount, status, provider, reference, createdAt FROM transactions WHERE gateway = 'SEPAY';

-- Check stock updates
SELECT p.name, pv.sku, s.quantity FROM stocks s
JOIN product_variants pv ON s.variantId = pv.id
JOIN products p ON pv.productId = p.id;
```

## 5. Verification Checklist

### 5.1 Database Records

- [ ] **Order created** với status `PENDING`
- [ ] **Order updated** thành `PAID` khi thanh toán thành công
- [ ] **Order updated** thành `CANCELLED` khi thanh toán thất bại
- [ ] **Transaction record** created với đầy đủ thông tin
- [ ] **Stock deducted** khi order được tạo
- [ ] **Stock restored** khi order bị hủy

### 5.2 API Responses

- [ ] **Order creation** returns correct format
- [ ] **QR URL** generated correctly
- [ ] **Webhook responses** return proper HTTP codes
- [ ] **Error responses** include meaningful messages

### 5.3 Security Validations

- [ ] **IP whitelist** enforced correctly
- [ ] **Signature validation** working
- [ ] **Amount validation** prevents tampering
- [ ] **Idempotency** prevents duplicates

### 5.4 UI/UX Verifications

- [ ] **Loading states** displayed during processing
- [ ] **Success messages** shown correctly
- [ ] **Error messages** user-friendly
- [ ] **Redirect URLs** working properly
- [ ] **Mobile responsiveness** maintained

### 5.5 Logging & Monitoring

- [ ] **Webhook events** logged with details
- [ ] **Errors logged** with stack traces
- [ ] **Performance metrics** captured
- [ ] **Audit trail** maintained

## 6. Troubleshooting Guide

### 6.1 Common Issues

#### Webhook Not Received

1. **Check ngrok tunnel**:

   ```bash
   curl http://localhost:4040/api/tunnels
   ```

2. **Verify webhook URL** in SePay dashboard

3. **Check server logs**:
   ```bash
   tail -f logs/development.log
   ```

#### Order Not Updated

1. **Check webhook payload** format
2. **Verify signature validation**
3. **Check database connection**
4. **Review transaction logs**

#### QR Code Not Generated

1. **Check SePay account info**
2. **Verify environment variables**
3. **Check amount format** (must be integer)

### 6.2 Debug Commands

```bash
# Check environment variables
printenv | grep SEPAY

# Test database connection
npx prisma db pull

# Check migrations
npx prisma migrate status

# View webhook logs
grep "webhook" logs/development.log
```

## 7. Pre-Production Checklist

### 7.1 Environment Setup

- [ ] Production environment variables configured
- [ ] Production database migrated
- [ ] SSL certificates installed
- [ ] Domain names configured

### 7.2 SePay Production Setup

- [ ] Production merchant account activated
- [ ] Production webhook URLs set
- [ ] IP whitelist configured
- [ ] Rate limits understood

### 7.3 Final Testing

- [ ] End-to-end payment flow tested
- [ ] Error scenarios tested
- [ ] Performance under load tested
- [ ] Security audit completed

## 8. Contact & Support

- **SePay Developer Support**: support@sepay.vn
- **Technical Documentation**: https://docs.sepay.vn
- **Sandbox Dashboard**: https://sandbox.sepay.vn
- **Production Dashboard**: https://dashboard.sepay.vn

---

**Lưu ý**: Hướng dẫn này được thiết kế cho môi trường sandbox. Trước khi triển khai production, hãy đảm bảo tất cả các test scenarios đã được thực hiện và verified.
