import SepayCheckoutForm from './SepayCheckoutForm'

// Example usage of SepayCheckoutForm component
export default function SepayCheckoutExample() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">SePay Checkout Example</h1>

      {/* Basic usage */}
      <SepayCheckoutForm
        orderId="ORD-12345"
        amount={150000}
        description="Mua hàng AI4Chill"
        paymentMethod="BANK_TRANSFER"
        onSuccess={() => console.log('Payment successful')}
        onError={error => console.error('Payment error:', error)}
      />

      {/* With buyer info and auto-submit */}
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
        onSuccess={() => console.log('Payment successful')}
        onError={error => console.error('Payment error:', error)}
        autoSubmit={true}
      />
    </div>
  )
}
