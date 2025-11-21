import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
// import { PrismaAdapter } from '@auth/prisma-adapter' // Temporarily disabled due to type conflicts
import { prisma } from './db'
import { verifyPassword } from './password'
import { InMemoryRateLimiter, getClientIP } from './rate-limiter'
import type { JWT } from 'next-auth/jwt'

// Environment validation
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set')
}

if (!process.env.NEXTAUTH_URL) {
  throw new Error('NEXTAUTH_URL is not set')
}

// Create rate limiter for login attempts (100 requests per minute per IP)
const loginRateLimiter = new InMemoryRateLimiter(100, 60 * 1000)

export const { handlers, auth, signIn, signOut } = NextAuth({
  // adapter: PrismaAdapter(prisma), // Temporarily disabled due to type conflicts
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Apply rate limiting based on client IP
        const clientIP = getClientIP(req)
        const rateLimitResult = loginRateLimiter.isAllowed(clientIP)

        if (!rateLimitResult.allowed) {
          console.warn(`Rate limit exceeded for IP: ${clientIP}`)
          throw new Error('Too many login attempts. Please try again later.')
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email as string,
            },
          })

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await verifyPassword(
            credentials.password as string,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            // Note: role field removed - not in database schema
          }
        } catch (error) {
          console.error('Auth error:', error)
          // Re-throw rate limit errors
          if (
            error instanceof Error &&
            error.message.includes('Too many login attempts')
          ) {
            throw error
          }
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Store user data in token
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.email = token.email as string
        session.user.name = token.name as string | null
        // Note: role removed - not in database schema
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
})
