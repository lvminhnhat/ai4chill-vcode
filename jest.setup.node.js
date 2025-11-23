// Setup for Node.js environment (server-side tests)
const { TextEncoder, TextDecoder } = require('util')

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(url, options = {}) {
      this.url = url
      this.method = options.method || 'GET'
      this.headers = new Map(Object.entries(options.headers || {}))
      this.body = options.body
      this.text = jest.fn().mockResolvedValue(options.body || '')
    }
  },
  NextResponse: {
    json: jest.fn((data, init = {}) => ({
      status: init.status || 200,
      json: async () => data,
      headers: new Map(Object.entries(init.headers || {})),
    })),
  },
}))

// Mock crypto for Node.js environment
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    timingSafeEqual: jest.fn((a, b) => {
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
      }
      return true
    }),
  }
}
