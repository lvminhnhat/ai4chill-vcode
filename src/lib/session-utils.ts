import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { Session } from 'next-auth'

/**
 * Retrieves the current server-side session
 * @returns Promise<Session | null> - The current session or null if not authenticated
 * @example
 * ```typescript
 * const session = await getServerSession()
 * if (session) {
 *   console.log('User is authenticated:', session.user.email)
 * }
 * ```
 */
export async function getServerSession(): Promise<Session | null> {
  return await auth()
}

/**
 * Requires authentication and redirects to sign-in page if not authenticated
 * @returns Promise<Session> - The authenticated session
 * @throws Redirects to /auth/signin if no session exists
 * @example
 * ```typescript
 * // In a server component or route handler
 * const session = await requireAuth()
 * // User is guaranteed to be authenticated here
 * console.log('Authenticated user:', session.user.email)
 * ```
 */
export async function requireAuth(): Promise<Session> {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  return session
}

/**
 * Gets the current user from the session
 * @returns Promise<User | null> - The user object or null if not authenticated
 * @example
 * ```typescript
 * const user = await getCurrentUser()
 * if (user) {
 *   console.log('User ID:', user.id)
 *   console.log('User email:', user.email)
 * }
 * ```
 */
export async function getCurrentUser() {
  const session = await getServerSession()
  
  return session?.user || null
}

// Note: isAdmin() and requireAdmin() removed - no role field in database schema
// If you need role-based access control, add role field to database first
