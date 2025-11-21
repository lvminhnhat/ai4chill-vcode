import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Define types matching our auth types
type User = {
  id: string
  email: string
  name?: string | null
}

type Session = {
  user: User
  expires: string
}

// Mock dependencies FIRST before any imports
const mockAuth = jest.fn() as jest.MockedFunction<() => Promise<Session | null>>
const mockRedirect = jest.fn() as jest.MockedFunction<(url: string) => never>

jest.mock('@/lib/auth', () => ({
  auth: mockAuth,
}))

jest.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

describe('Session Utilities', () => {
  // Import inside describe to ensure mocks are set up first
  let getServerSession: () => Promise<Session | null>
  let requireAuth: () => Promise<Session>
  let getCurrentUser: () => Promise<User | null>

  beforeAll(async () => {
    const sessionUtils = await import('@/lib/session-utils')
    getServerSession = sessionUtils.getServerSession
    requireAuth = sessionUtils.requireAuth
    getCurrentUser = sessionUtils.getCurrentUser
  })
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getServerSession()', () => {
    it('should return session when user is authenticated', async () => {
      // Arrange
      const mockSession: Session = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
        },
        expires: '2025-12-31T23:59:59.999Z',
      }

      mockAuth.mockResolvedValue(mockSession)

      // Act
      const result = await getServerSession()

      // Assert
      expect(mockAuth).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockSession)
      expect(result?.user.email).toBe('test@example.com')
    })

    it('should return null when user is not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const result = await getServerSession()

      // Assert
      expect(mockAuth).toHaveBeenCalledTimes(1)
      expect(result).toBeNull()
    })

    it('should handle auth errors gracefully', async () => {
      // Arrange
      mockAuth.mockRejectedValue(new Error('Auth service unavailable'))

      // Act & Assert
      await expect(getServerSession()).rejects.toThrow(
        'Auth service unavailable'
      )
      expect(mockAuth).toHaveBeenCalledTimes(1)
    })
  })

  describe('requireAuth()', () => {
    it('should return session when user is authenticated', async () => {
      // Arrange
      const mockSession: Session = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
        },
        expires: '2025-12-31T23:59:59.999Z',
      }

      mockAuth.mockResolvedValue(mockSession)

      // Act
      const result = await requireAuth()

      // Assert
      expect(mockAuth).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockSession)
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should redirect to signin when user is not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT') // Next.js redirect throws to stop execution
      })

      // Act & Assert
      await expect(requireAuth()).rejects.toThrow('NEXT_REDIRECT')
      expect(mockAuth).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith('/auth/signin')
    })

    it('should handle session with missing user gracefully', async () => {
      // Arrange
      const mockSession: any = {
        expires: '2025-12-31T23:59:59.999Z',
        // user missing
      }

      mockAuth.mockResolvedValue(mockSession)

      // Act
      const result = await requireAuth()

      // Assert - Should still return session even if user is missing
      expect(mockAuth).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockSession)
      expect(mockRedirect).not.toHaveBeenCalled()
    })
  })

  describe('getCurrentUser()', () => {
    it('should return user when authenticated', async () => {
      // Arrange
      const mockSession: Session = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
        },
        expires: '2025-12-31T23:59:59.999Z',
      }

      mockAuth.mockResolvedValue(mockSession)

      // Act
      const result = await getCurrentUser()

      // Assert
      expect(mockAuth).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
      })
    })

    it('should return null when user is not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const result = await getCurrentUser()

      // Assert
      expect(mockAuth).toHaveBeenCalledTimes(1)
      expect(result).toBeNull()
    })

    it('should return null when session exists but user is missing', async () => {
      // Arrange
      const mockSession: any = {
        expires: '2025-12-31T23:59:59.999Z',
        // user missing
      }

      mockAuth.mockResolvedValue(mockSession)

      // Act
      const result = await getCurrentUser()

      // Assert
      expect(mockAuth).toHaveBeenCalledTimes(1)
      expect(result).toBeNull()
    })

    it('should handle user with partial data', async () => {
      // Arrange
      const mockSession: Session = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          // name missing
        },
        expires: '2025-12-31T23:59:59.999Z',
      }

      mockAuth.mockResolvedValue(mockSession)

      // Act
      const result = await getCurrentUser()

      // Assert
      expect(mockAuth).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        id: 'user_123',
        email: 'test@example.com',
      })
      expect(result?.id).toBe('user_123')
      expect(result?.email).toBe('test@example.com')
    })

    it('should handle auth errors gracefully', async () => {
      // Arrange
      mockAuth.mockRejectedValue(new Error('Database connection failed'))

      // Act & Assert
      await expect(getCurrentUser()).rejects.toThrow(
        'Database connection failed'
      )
      expect(mockAuth).toHaveBeenCalledTimes(1)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle multiple consecutive calls efficiently', async () => {
      // Arrange
      const mockSession: Session = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
        },
        expires: '2025-12-31T23:59:59.999Z',
      }

      mockAuth.mockResolvedValue(mockSession)

      // Act
      const session1 = await getServerSession()
      const session2 = await getServerSession()
      const user = await getCurrentUser()

      // Assert
      expect(mockAuth).toHaveBeenCalledTimes(3)
      expect(session1).toEqual(mockSession)
      expect(session2).toEqual(mockSession)
      expect(user).toEqual(mockSession.user)
    })

    it('should handle session expiry scenarios', async () => {
      // Arrange - Session expired
      const expiredSession: Session = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
        },
        expires: '2020-01-01T00:00:00.000Z', // Expired date
      }

      // Note: NextAuth handles expiry internally, but session object may still exist
      mockAuth.mockResolvedValue(expiredSession)

      // Act
      const result = await getServerSession()

      // Assert - Should still return session (NextAuth handles validation)
      expect(mockAuth).toHaveBeenCalledTimes(1)
      expect(result).toEqual(expiredSession)
      expect(new Date(result!.expires) < new Date()).toBe(true)
    })
  })
})
