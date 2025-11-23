/**
 * IP Address Validation Utilities for SePay IPN Webhook
 *
 * Provides IP whitelist validation with support for individual IPs and CIDR notation.
 */

/**
 * Converts IPv4 address to integer for comparison
 */
export function ipToInt(ip: string): number {
  const parts = ip.split('.')
  if (parts.length !== 4) {
    throw new Error(`Invalid IPv4 address: ${ip}`)
  }

  return (
    (parseInt(parts[0]) << 24) |
    (parseInt(parts[1]) << 16) |
    (parseInt(parts[2]) << 8) |
    parseInt(parts[3])
  )
}

/**
 * Checks if an IP address is within a CIDR range
 */
export function isIPInCIDR(ip: string, cidr: string): boolean {
  const [network, prefixLength] = cidr.split('/')
  const prefix = parseInt(prefixLength, 10)

  if (isNaN(prefix) || prefix < 0 || prefix > 32) {
    throw new Error(`Invalid CIDR prefix length: ${prefixLength}`)
  }

  const ipInt = ipToInt(ip)
  const networkInt = ipToInt(network)

  const mask = (0xffffffff << (32 - prefix)) >>> 0
  return (ipInt & mask) === (networkInt & mask)
}

/**
 * Validates if an IP address is in the allowed list
 * Supports both individual IPs and CIDR notation
 */
export function isIPAllowed(ip: string, allowedIPs: string[]): boolean {
  if (!allowedIPs || allowedIPs.length === 0) {
    return false
  }

  for (const allowedIP of allowedIPs) {
    try {
      if (allowedIP.includes('/')) {
        // CIDR notation
        if (isIPInCIDR(ip, allowedIP)) {
          return true
        }
      } else {
        // Individual IP
        if (ip === allowedIP) {
          return true
        }
      }
    } catch (error) {
      console.error(`Error validating IP ${ip} against ${allowedIP}:`, error)
      continue
    }
  }

  return false
}

/**
 * Extracts client IP from request headers
 * Checks various headers in order of preference
 */
export function getClientIP(request: Request): string {
  // Check Cloudflare header first
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Check X-Forwarded-For header (can contain multiple IPs)
  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    // Take the first IP (original client)
    const ips = xForwardedFor.split(',').map(ip => ip.trim())
    if (ips.length > 0 && ips[0]) {
      return ips[0]
    }
  }

  // Check X-Real-IP header
  const xRealIP = request.headers.get('x-real-ip')
  if (xRealIP) {
    return xRealIP
  }

  // Fallback to remote address (not available in all environments)
  // In Next.js, we'll need to handle this differently
  throw new Error('Unable to determine client IP from request headers')
}
