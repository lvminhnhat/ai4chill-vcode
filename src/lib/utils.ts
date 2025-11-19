import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date utilities
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('vi-VN')
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('vi-VN')
}

// Common validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[0-9]{10,11}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Storage utilities
export const storage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  set: (key: string, value: unknown) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore errors
    }
  },
  remove: (key: string) => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
  },
}
