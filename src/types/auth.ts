import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      // Note: role field removed - not in database schema
    } & DefaultSession['user']
  }

  interface User {
    id: string
    email: string
    name: string | null
    // Note: role field removed - not in database schema
  }
}

// JWT types will be automatically inferred from callbacks in auth.ts
// No need to declare module 'next-auth/jwt' in NextAuth v5
