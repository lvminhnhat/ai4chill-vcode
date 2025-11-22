'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PaymentQRCode } from '@/components/PaymentQRCode'
import { Loader2, ShoppingCart, CheckCircle } from 'lucide-react'

interface TestProduct {
  id: string
  name: string
  price: number
  duration: string
  stock: number
}

const mockProducts: TestProduct[] = [
  {
    id: 'variant_1_month',
    name: 'ChatGPT Plus - 1 Tháng',
    price: 99000,
    duration: '30 ngày',
    stock: 100,
  },
  {
    id: 'variant_3_months',
    name: 'ChatGPT Plus - 3 Tháng',
    price: 267000,
    duration: '90 ngày',
    stock: 50,
  },
  {
    id: 'variant_6_months',
    name: 'ChatGPT Plus - 6 Tháng',
    price: 534000,
    duration: '180 ngày',
    stock: 25,
  },
]

export default function PaymentTestPage() {
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [orderResult, setOrderResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const handleCreateOrder = async () => {
    if (!selectedVariant) {
      setError('Vui lòng chọn sản phẩm')
      return
    }

    setIsCreatingOrder(true)
    setError('')

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'test_user_id', // This should come from authentication
          items: [
            {
              variantId: selectedVariant,
              quantity: quantity,
            },
          ],
        }),
      })

      const data = await response.json()

      if (data.success) {
        setOrderResult(data)
      } else {
        setError(data.error || 'Failed to create order')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      setError('Failed to create order. Please try again.')
    } finally {
      setIsCreatingOrder(false)
    }
  }

  const handlePaymentComplete = (orderId: string) => {
    console.log('Payment completed for order:', orderId)
    // You can redirect to success page or show success message
  }

  const selectedProduct = mockProducts.find(p => p.id === selectedVariant)
  const totalAmount = selectedProduct ? selectedProduct.price * quantity : 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Test Payment Flow</h1>
          <p className="text-gray-600">
            Test the complete Sepay payment integration
          </p>
        </div>

        {!orderResult ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Create Test Order
              </CardTitle>
              <CardDescription>
                Select a product and create an order to test payment
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Product Selection */}
              <div className="space-y-2">
                <Label htmlFor="product">Select Product</Label>
                <Select
                  value={selectedVariant}
                  onValueChange={setSelectedVariant}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProducts.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          <span className="text-sm text-gray-500">
                            {formatAmount(product.price)} - {product.stock} in
                            stock
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedProduct?.stock || 1}
                  value={quantity}
                  onChange={e =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                />
              </div>

              {/* Total Amount */}
              {selectedProduct && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-xl font-bold text-primary">
                      {formatAmount(totalAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Create Order Button */}
              <Button
                onClick={handleCreateOrder}
                disabled={!selectedVariant || isCreatingOrder}
                className="w-full"
              >
                {isCreatingOrder ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  'Create Order & Generate QR'
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Order Success Message */}
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  <div>
                    <h3 className="font-semibold">
                      Order Created Successfully!
                    </h3>
                    <p className="text-sm text-gray-600">
                      Order ID: #{orderResult.orderId.slice(-8)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment QR Code */}
            <PaymentQRCode
              orderId={orderResult.orderId}
              amount={orderResult.totalAmount}
              qrUrl={orderResult.qrUrl}
              onPaymentComplete={handlePaymentComplete}
            />

            {/* Reset Button */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setOrderResult(null)
                  setSelectedVariant('')
                  setQuantity(1)
                  setError('')
                }}
              >
                Create Another Test Order
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <h4 className="font-semibold mb-2">1. Setup Test Data:</h4>
              <code className="block p-2 bg-gray-100 rounded text-xs">
                npm run create-test-data
              </code>
            </div>

            <div className="text-sm">
              <h4 className="font-semibold mb-2">2. Test Webhook:</h4>
              <code className="block p-2 bg-gray-100 rounded text-xs">
                curl -X POST http://localhost:3000/api/test/sepay-webhook {'\n'}
                {'  '}-H "Content-Type: application/json" {'\n'}
                {'  '}-d '
                {{
                  orderId: "' + (orderResult?.orderId || 'ORDER_ID') + '",
                  amount: ' + totalAmount + ',
                }}
                '
              </code>
            </div>

            <div className="text-sm">
              <h4 className="font-semibold mb-2">3. Check Order Status:</h4>
              <p>
                Visit:{' '}
                <code>
                  /api/orders/{orderResult?.orderId || 'ORDER_ID'}/status
                </code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
