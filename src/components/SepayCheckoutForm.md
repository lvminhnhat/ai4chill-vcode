# SePayCheckoutForm Component

Component React để tích hợp thanh toán SePay vào ứng dụng Next.js.

## Features

- ✅ Tự động tạo mã hóa đơn duy nhất
- ✅ Hỗ trợ tất cả phương thức thanh toán của SePay
- ✅ Tự động submit form (tùy chọn)
- ✅ Responsive design với Tailwind CSS
- ✅ Error handling và loading states
- ✅ TypeScript types đầy đủ
- ✅ Sử dụng shadcn/ui components

## Props

```typescript
interface SepayCheckoutFormProps {
  orderId: string // ID của đơn hàng
  amount: number // Số tiền thanh toán (VND)
  description: string // Mô tả đơn hàng
  paymentMethod: 'BANK_TRANSFER' | 'CARD' | 'NAPAS_BANK_TRANSFER'
  buyerInfo?: {
    // Thông tin người mua (tùy chọn)
    name?: string
    email?: string
    phone?: string
  }
  onSuccess?: () => void // Callback khi thanh toán thành công
  onError?: (error: Error) => void // Callback khi có lỗi
  autoSubmit?: boolean // Tự động submit form (default: false)
}
```

## Usage Examples

### Basic Usage

```tsx
import SepayCheckoutForm from '@/components/SepayCheckoutForm'

export default function PaymentPage() {
  return (
    <SepayCheckoutForm
      orderId="ORD-12345"
      amount={150000}
      description="Mua hàng AI4Chill"
      paymentMethod="BANK_TRANSFER"
      onSuccess={() => console.log('Payment successful')}
      onError={error => console.error('Payment error:', error)}
    />
  )
}
```

### With Buyer Info

```tsx
<SepayCheckoutForm
  orderId="ORD-12346"
  amount={299000}
  description="Gói Premium AI4Chill"
  paymentMethod="CARD"
  buyerInfo={{
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0901234567',
  }}
  onSuccess={() => router.push('/payment/success')}
  onError={error => setError(error.message)}
/>
```

### Auto-submit Mode

```tsx
<SepayCheckoutForm
  orderId="ORD-12347"
  amount={500000}
  description="Thanh toán tự động"
  paymentMethod="NAPAS_BANK_TRANSFER"
  autoSubmit={true} // Tự động submit sau 1 giây
/>
```

## Environment Variables

Component này yêu cầu các environment variables sau:

```bash
# SePay SDK Configuration
SEPAY_MERCHANT_ID=your_merchant_id
SEPAY_SECRET_KEY=your_merchant_secret_key
SEPAY_ENV=sandbox

# Payment Callback URLs
NEXT_PUBLIC_SUCCESS_URL=/payment/success
NEXT_PUBLIC_ERROR_URL=/payment/error
NEXT_PUBLIC_CANCEL_URL=/payment/cancel

# Next.js Configuration
NEXTAUTH_URL=https://your-domain.com
```

## Component Structure

Component bao gồm:

1. **Loading State**: Hiển thị spinner khi đang chuẩn bị thanh toán
2. **Error State**: Hiển thị thông báo lỗi nếu có vấn đề
3. **Order Summary**: Hiển thị thông tin đơn hàng
4. **Buyer Info**: Hiển thị thông tin người mua (nếu có)
5. **Payment Form**: Form ẩn chứa các field cần thiết cho SePay
6. **Submit Button**: Nút thanh toán với loading state

## Error Handling

Component tự động xử lý các lỗi sau:

- ❌ Thiếu environment variables
- ❌ Số tiền không hợp lệ (≤ 0)
- ❌ URL callback không hợp lệ
- ❌ Lỗi khởi tạo SDK
- ❌ Lỗi tạo checkout fields

## Styling

Component sử dụng:

- **shadcn/ui**: Card, Button, Badge components
- **Tailwind CSS**: Responsive design và styling
- **Lucide React**: Icons cho loading và error states

## Security

- ✅ Tất cả dữ liệu nhạy cảm được truyền qua hidden form fields
- ✅ Signature được tạo tự động bởi SePay SDK
- ✅ Callback URLs được xây dựng với orderId parameter
- ✅ Không lưu trữ thông tin thẻ tín dụng

## Browser Support

Component hỗ trợ tất cả modern browsers:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

```json
{
  "react": "^18.0.0",
  "next": "^14.0.0",
  "sepay-pg-node": "^1.0.0",
  "@radix-ui/react-slot": "^1.0.0",
  "class-variance-authority": "^0.7.0",
  "tailwindcss": "^3.0.0"
}
```
