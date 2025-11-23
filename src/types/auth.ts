import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      role: 'USER' | 'ADMIN'
    } & DefaultSession['user']
  }

  interface User {
    id: string
    email: string
    name: string | null
    role: 'USER' | 'ADMIN'
  }
}

// JWT types will be automatically inferred from callbacks in auth.ts
// No need to declare module 'next-auth/jwt' in NextAuth v5
