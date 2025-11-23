# Payment Callback Pages

Đây là ba trang callback cho kết quả thanh toán được tạo theo yêu cầu Issue #30 - Phase 2.4.

## Các trang đã tạo

### 1. Success Page - `/payment/success`

- **URL**: `/payment/success?orderId=<order_id>`
- **Mục đích**: Hiển thị khi thanh toán thành công
- **Tính năng**:
  - Lấy thông tin đơn hàng từ query parameter `orderId`
  - Hiển thị thông báo thành công với icon checkmark màu xanh
  - Hiển thị chi tiết đơn hàng (mã đơn hàng, tổng tiền, phương thức thanh toán, sản phẩm)
  - Nút "Xem chi tiết đơn hàng" dẫn đến `/orders/[orderId]`
  - Nút "Tiếp tục mua sắm" dẫn về trang chủ
  - Tự động chuyển hướng sau 5 giây
  - Theme màu xanh lá cây

### 2. Error Page - `/payment/error`

- **URL**: `/payment/error?orderId=<order_id>&error=<error_message>`
- **Mục đích**: Hiển thị khi thanh toán thất bại
- **Tính năng**:
  - Lấy orderId và error message từ query parameters
  - Hiển thị thông báo lỗi với icon X màu đỏ
  - Hiển thị chi tiết đơn hàng nếu có orderId
  - Component Alert để hiển thị lỗi
  - Nút "Thử lại thanh toán" để quay lại checkout
  - Nút "Liên hệ hỗ trợ" và "Về giỏ hàng"
  - Theme màu đỏ

### 3. Cancel Page - `/payment/cancel`

- **URL**: `/payment/cancel?orderId=<order_id>`
- **Mục đích**: Hiển thị khi người dùng hủy thanh toán
- **Tính năng**:
  - Lấy orderId từ query parameter
  - Hiển thị thông báo hủy với icon info màu vàng
  - Hiển thị chi tiết đơn hàng (vẫn ở trạng thái PENDING)
  - Nút "Tiếp tục thanh toán" để quay lại checkout
  - Nút "Về giỏ hàng"
  - Theme màu vàng/cam

## API Endpoint

### GET `/api/orders/[id]`

- **Mục đích**: Lấy chi tiết đơn hàng cho các trang callback
- **Response**:
  ```json
  {
    "id": "order_id",
    "status": "PAID|PENDING|CANCELLED",
    "total": 100000,
    "invoiceNumber": "INV-001",
    "paymentMethod": "BANK_TRANSFER",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com"
    },
    "items": [...],
    "transaction": {...}
  }
  ```

## Components sử dụng

- **shadcn/ui**: Card, Button, Badge, Alert
- **Lucide Icons**: CheckCircle2, XCircle, Info, Package, CreditCard, Clock, ShoppingCart, RefreshCw, AlertTriangle, MessageCircle
- **Next.js**: App Router, useSearchParams, useRouter, Link

## Responsive Design

Tất cả các trang đều được thiết kế responsive:

- Mobile-first approach
- Grid layout cho desktop
- Flex layout cho mobile
- Buttons stack vertically trên mobile

## Error Handling

- Loading state khi fetch data
- Error handling khi order không tìm thấy
- Fallback UI khi không có orderId
- Proper error messages bằng tiếng Việt

## SEO Metadata

Mỗi trang đều có:

- Proper title tags
- Meta descriptions
- Semantic HTML structure
- Accessible labels

## Ngôn ngữ

Tất cả UI text đều bằng tiếng Việt theo yêu cầu.

## Testing

Để test các trang này:

1. **Success Page**:

   ```
   /payment/success?orderId=test_order_id
   ```

2. **Error Page**:

   ```
   /payment/error?orderId=test_order_id&error=Payment%20failed
   ```

3. **Cancel Page**:
   ```
   /payment/cancel?orderId=test_order_id
   ```

## Integration với Payment Gateway

Các trang này được thiết kế để làm callback URLs cho các cổng thanh toán như SePay:

- **Success URL**: `https://yourdomain.com/payment/success`
- **Error URL**: `https://yourdomain.com/payment/error`
- **Cancel URL**: `https://yourdomain.com/payment/cancel`

Cổng thanh toán sẽ redirect về các URL này với các query parameters tương ứng.
