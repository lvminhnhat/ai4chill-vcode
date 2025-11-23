'use client'

// Demo page for SePayCheckoutForm component
// This file demonstrates how to use the component in a Next.js page

import SepayCheckoutForm from '@/components/SepayCheckoutForm'

export default function PaymentDemoPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          SePay Payment Demo
        </h1>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Basic Example */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Basic Usage</h2>
            <SepayCheckoutForm
              orderId="DEMO-001"
              amount={150000}
              description="Mua hàng AI4Chill - Basic Package"
              paymentMethod="BANK_TRANSFER"
              onSuccess={() => console.log('Payment successful')}
              onError={error => console.error('Payment error:', error)}
            />
          </div>

          {/* With Buyer Info */}
          <div>
            <h2 className="text-xl font-semibold mb-4">With Buyer Info</h2>
            <SepayCheckoutForm
              orderId="DEMO-002"
              amount={299000}
              description="Mua hàng AI4Chill - Premium Package"
              paymentMethod="CARD"
              buyerInfo={{
                name: 'Nguyễn Văn A',
                email: 'nguyenvana@example.com',
                phone: '0901234567',
              }}
              onSuccess={() => console.log('Premium payment successful')}
              onError={error => console.error('Premium payment error:', error)}
            />
          </div>

          {/* NAPAS Example */}
          <div>
            <h2 className="text-xl font-semibold mb-4">NAPAS Transfer</h2>
            <SepayCheckoutForm
              orderId="DEMO-003"
              amount={500000}
              description="Mua hàng AI4Chill - Enterprise Package"
              paymentMethod="NAPAS_BANK_TRANSFER"
              buyerInfo={{
                name: 'Công ty ABC',
                email: 'contact@abc.com',
                phone: '0909876543',
              }}
              onSuccess={() => console.log('Enterprise payment successful')}
              onError={error =>
                console.error('Enterprise payment error:', error)
              }
            />
          </div>

          {/* Auto-submit Example */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Auto-submit Mode</h2>
            <SepayCheckoutForm
              orderId="DEMO-004"
              amount={99000}
              description="Mua hàng AI4Chill - Trial Package"
              paymentMethod="BANK_TRANSFER"
              autoSubmit={true}
              onSuccess={() => console.log('Auto-submit payment successful')}
              onError={error =>
                console.error('Auto-submit payment error:', error)
              }
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Hướng dẫn sử dụng</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. Component sẽ tự động tạo mã hóa đơn duy nhất</p>
            <p>2. Tự động xây dựng callback URLs từ environment variables</p>
            <p>
              3. Hỗ trợ 3 phương thức thanh toán: BANK_TRANSFER, CARD,
              NAPAS_BANK_TRANSFER
            </p>
            <p>
              4. Có thể bật chế độ auto-submit để tự động chuyển đến trang thanh
              toán
            </p>
            <p>5. Xử lý lỗi và loading states tự động</p>
          </div>
        </div>
      </div>
    </div>
  )
}
