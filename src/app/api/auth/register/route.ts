import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { isValidEmail } from '@/lib/utils'
import { registrationRateLimiter, getClientIP } from '@/lib/rate-limiter'

interface RegisterRequest {
  email: string
  password: string
  name?: string
}

interface RegisterResponse {
  success: boolean
  message: string
  user?: {
    id: string
    email: string
    name: string | null
    role: 'USER' | 'ADMIN'
  }
}

interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<RegisterResponse | ErrorResponse>> {
  try {
    // Apply rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = registrationRateLimiter.isAllowed(clientIP)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests. Please try again later.',
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
            'Retry-After': '60',
          },
        }
      )
    }

    // Parse request body
    let body: RegisterRequest

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body',
          },
        },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required',
          },
        },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(body.email)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email format',
          },
        },
        { status: 400 }
      )
    }

    // Validate password (hashPassword will validate length, but we can provide better error message)
    if (body.password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Password must be at least 8 characters long',
          },
        },
        { status: 400 }
      )
    }

    if (body.password.length > 72) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Password must be less than 72 characters long',
          },
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: body.email.toLowerCase(),
      },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_EMAIL',
            message: 'User with this email already exists',
          },
        },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(body.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        password: hashedPassword,
        name: body.name || null,
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        user,
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': registrationRateLimiter
            .getRemainingRequests(clientIP)
            .toString(),
        },
      }
    )
  } catch (error) {
    console.error('Registration error:', error)

    // Handle specific password validation errors
    if (error instanceof Error && error.message.includes('Password')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        },
        { status: 400 }
      )
    }

    // Handle Prisma unique constraint error
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_EMAIL',
            message: 'User with this email already exists',
          },
        },
        { status: 409 }
      )
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    )
  }
}
