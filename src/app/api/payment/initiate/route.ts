import { NextRequest, NextResponse } from 'next/server'
import { initiatePayment } from '@/app/actions/initiate-payment'

/**
 * API endpoint to initiate payment for an order
 *
 * This is a wrapper around the initiatePayment server action
 * to allow client-side calls.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await initiatePayment(body)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in initiate payment API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
