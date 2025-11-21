interface RateLimitEntry {
  count: number
  resetTime: number
}

export class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number = 100, windowMs: number = 60 * 1000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs

    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup()
    }, 60 * 1000)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }

  public isAllowed(identifier: string): {
    allowed: boolean
    resetTime?: number
  } {
    const now = Date.now()
    const entry = this.store.get(identifier)

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return { allowed: true }
    }

    if (entry.count >= this.maxRequests) {
      return { allowed: false, resetTime: entry.resetTime }
    }

    // Increment count
    entry.count++
    return { allowed: true }
  }

  public getRemainingRequests(identifier: string): number {
    const entry = this.store.get(identifier)
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests
    }
    return Math.max(0, this.maxRequests - entry.count)
  }
}

// Create a singleton instance for the registration endpoint
export const registrationRateLimiter = new InMemoryRateLimiter(100, 60 * 1000) // 100 requests per minute

// Helper function to get client IP from request
export function getClientIP(request: Request): string {
  // Try various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip') // Cloudflare

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Fallback to a default identifier
  return 'unknown'
}
