import 'next-auth'
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      role: 'USER' | 'ADMIN'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'USER' | 'ADMIN'
  }
}

// Extend NextAuth request type for middleware
declare module 'next-auth' {
  interface Auth {
    user?: {
      id: string
      email: string
      name: string | null
      role: 'USER' | 'ADMIN'
    }
  }
}
