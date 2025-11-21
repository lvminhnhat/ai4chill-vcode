// API service types and configurations
export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  status: number
}

export interface ApiError {
  message: string
  status: number
  code?: string
}

// Standardized error response format (Architecture spec Section 4.2)
export interface StandardErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

// Common error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  SERVER_ERROR: 'SERVER_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
} as const

// Base API configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
} as const

// Re-export auth types for convenience
// These will be available after NextAuth types are properly set up
// export type { Session, User } from '@/types/auth'
