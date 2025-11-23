/**
 * Type definitions for SePay IPN (Instant Payment Notification) webhook
 */

export interface SepayIpnPayload {
  order_invoice_number: string
  sepay_order_id: string
  status: string
  amount: number
  payment_method: string
  transaction_time: string
  signature: string
  custom_data?: any
  [key: string]: any // Allow additional properties
}

export type SepayIpnStatus =
  | 'ORDER_PAID'
  | 'ORDER_FAILED'
  | 'ORDER_PENDING'
  | 'ORDER_PROCESSING'
  | 'ORDER_CANCELLED'

export interface SepayIpnCustomData {
  buyer_name?: string
  buyer_email?: string
  buyer_phone?: string
  [key: string]: any
}
