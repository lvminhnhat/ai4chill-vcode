import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 72 // bcrypt limit

/**
 * Hash a password using bcrypt with validation
 *
 * Security Notes:
 * - Uses bcrypt with 10 salt rounds for good security/performance balance
 * - Passwords are automatically salted with unique salts per hash
 * - bcrypt has built-in protection against rainbow table attacks
 * - Maximum password length is 72 characters due to bcrypt limitations
 *
 * @param password - The plain text password to hash (must be 8-72 characters)
 * @returns Promise<string> - The hashed password
 * @throws Error if password is invalid (too short, too long, or empty)
 *
 * @example
 * ```typescript
 * try {
 *   const hashedPassword = await hashPassword('userPassword123')
 *   console.log('Password hashed successfully')
 * } catch (error) {
 *   console.error('Password validation failed:', error.message)
 * }
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  // Validate password
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required and must be a string')
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
    )
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be less than ${MAX_PASSWORD_LENGTH} characters long`
    )
  }

  // Check for whitespace-only passwords
  if (password.trim().length === 0) {
    throw new Error('Password cannot be whitespace only')
  }

  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against its hash
 *
 * Security Notes:
 * - Uses bcrypt's timing-attack resistant comparison
 * - Returns false for invalid hash formats to prevent timing attacks
 * - Handles bcrypt errors gracefully
 *
 * @param password - The plain text password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns Promise<boolean> - True if password matches, false otherwise
 * @throws Error if parameters are invalid
 *
 * @example
 * ```typescript
 * try {
 *   const isValid = await verifyPassword('userPassword123', hashedPassword)
 *   if (isValid) {
 *     console.log('Authentication successful')
 *   } else {
 *     console.log('Invalid credentials')
 *   }
 * } catch (error) {
 *   console.error('Verification error:', error.message)
 * }
 * ```
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  // Validate inputs
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required and must be a string')
  }

  if (!hashedPassword || typeof hashedPassword !== 'string') {
    throw new Error('Hashed password is required and must be a string')
  }

  // Basic bcrypt hash format validation
  if (!hashedPassword.startsWith('$2') || hashedPassword.length < 60) {
    // Return false instead of throwing to prevent timing attacks
    return false
  }

  try {
    return bcrypt.compare(password, hashedPassword)
  } catch (error) {
    // Log error for debugging but return false to user
    console.error('Password verification error:', error)
    return false
  }
}
