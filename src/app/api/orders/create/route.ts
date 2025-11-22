import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/app/actions/create-order'

/**
 * API endpoint to create orders
 *
 * This is a wrapper around the createOrder server action
 * to allow client-side calls.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await createOrder(body)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in create order API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
