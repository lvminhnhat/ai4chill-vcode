import { InMemoryRateLimiter } from '../rate-limiter'

describe('Rate Limiter', () => {
  let rateLimiter: InMemoryRateLimiter

  beforeEach(() => {
    rateLimiter = new InMemoryRateLimiter(5, 1000) // 5 requests per second for testing
  })

  it('should allow requests within limit', () => {
    const identifier = 'test-ip'

    // First 5 requests should be allowed
    for (let i = 0; i < 5; i++) {
      const result = rateLimiter.isAllowed(identifier)
      expect(result.allowed).toBe(true)
    }
  })

  it('should block requests exceeding limit', () => {
    const identifier = 'test-ip'

    // Use up the limit
    for (let i = 0; i < 5; i++) {
      rateLimiter.isAllowed(identifier)
    }

    // Next request should be blocked
    const result = rateLimiter.isAllowed(identifier)
    expect(result.allowed).toBe(false)
    expect(result.resetTime).toBeDefined()
  })

  it('should reset after window expires', async () => {
    const identifier = 'test-ip'

    // Use up the limit
    for (let i = 0; i < 5; i++) {
      rateLimiter.isAllowed(identifier)
    }

    // Should be blocked
    let result = rateLimiter.isAllowed(identifier)
    expect(result.allowed).toBe(false)

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 1100))

    // Should be allowed again
    result = rateLimiter.isAllowed(identifier)
    expect(result.allowed).toBe(true)
  })

  it('should handle multiple identifiers independently', () => {
    const ip1 = '192.168.1.1'
    const ip2 = '192.168.1.2'

    // Use up limit for IP1
    for (let i = 0; i < 5; i++) {
      rateLimiter.isAllowed(ip1)
    }

    // IP1 should be blocked
    expect(rateLimiter.isAllowed(ip1).allowed).toBe(false)

    // IP2 should still be allowed
    expect(rateLimiter.isAllowed(ip2).allowed).toBe(true)
  })

  it('should return remaining requests correctly', () => {
    const identifier = 'test-ip'

    // Initially should have full limit
    expect(rateLimiter.getRemainingRequests(identifier)).toBe(5)

    // After 3 requests
    for (let i = 0; i < 3; i++) {
      rateLimiter.isAllowed(identifier)
    }
    expect(rateLimiter.getRemainingRequests(identifier)).toBe(2)

    // After using all
    for (let i = 0; i < 2; i++) {
      rateLimiter.isAllowed(identifier)
    }
    expect(rateLimiter.getRemainingRequests(identifier)).toBe(0)
  })
})
