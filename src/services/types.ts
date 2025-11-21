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

// Base API configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
} as const

// Re-export auth types for convenience
// These will be available after NextAuth types are properly set up
// export type { Session, User } from '@/types/auth'
