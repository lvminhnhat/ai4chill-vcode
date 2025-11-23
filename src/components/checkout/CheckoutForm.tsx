'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCart } from '@/stores/cart'
import { createOrder } from '@/app/actions/order-actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { z, ZodError } from 'zod'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const checkoutSchema = z.object({
  email: z.string().email('Vui lòng nhập email hợp lệ'),
  name: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Bạn phải chấp nhận điều khoản và điều kiện',
  }),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

export function CheckoutForm() {
  const { items, clearCart } = useCart()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: '',
      name: '',
      acceptTerms: false,
    },
  })

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true)
    try {
      const result = await createOrder({
        items: items,
        email: data.email,
        name: data.name,
      })

      if (result.success) {
        clearCart() // Clear cart only AFTER successful order
        toast.success('Đặt hàng thành công!')
        router.push(`/checkout/success?orderId=${result.orderId}`)
      } else {
        toast.error(result.error || 'Có lỗi xảy ra. Vui lòng thử lại.')
      }
    } catch (error) {
      // Handle specific error types
      if (error instanceof ZodError) {
        toast.error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại form.')
        // Log validation errors using proper logger
        logger.validationError(error.issues, 'CheckoutForm')
      } else if (error instanceof Error) {
        if (
          error.message.includes('stock') ||
          error.message.includes('hết hàng')
        ) {
          toast.error('Sản phẩm đã hết hàng. Vui lòng chọn sản phẩm khác.')
        } else if (
          error.message.includes('inventory') ||
          error.message.includes('tồn kho')
        ) {
          toast.error(
            'Sản phẩm không đủ số lượng trong kho. Vui lòng giảm số lượng.'
          )
        } else if (
          error.message.includes('payment') ||
          error.message.includes('thanh toán')
        ) {
          toast.error('Lỗi xử lý thanh toán. Vui lòng thử lại sau.')
        } else {
          toast.error('Không thể tạo đơn hàng. Vui lòng thử lại sau.')
        }
        // Log error using proper logger
        logger.checkoutError(error, {
          userEmail: data.email,
          userName: data.name,
          itemsCount: items.length,
        })
      } else {
        toast.error('Đã xảy ra lỗi không xác định. Vui lòng liên hệ hỗ trợ.')
        logger.error('Unknown checkout error', { error })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin thanh toán</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ và tên</FormLabel>
                  <FormControl>
                    <Input placeholder="Nguyễn Văn A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Tôi chấp nhận điều khoản và điều kiện *
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Đặt hàng'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
