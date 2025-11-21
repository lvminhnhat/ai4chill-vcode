import { hashPassword, verifyPassword } from '../password'

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123'
      const hashedPassword = await hashPassword(password)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword.length).toBeGreaterThan(50)
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })

    it('should reject passwords shorter than 8 characters', async () => {
      const shortPassword = '1234567'

      await expect(hashPassword(shortPassword)).rejects.toThrow(
        'Password must be at least 8 characters long'
      )
    })

    it('should reject passwords longer than 72 characters', async () => {
      const longPassword = 'a'.repeat(73)

      await expect(hashPassword(longPassword)).rejects.toThrow(
        'Password must be less than 72 characters long'
      )
    })

    it('should reject empty passwords', async () => {
      await expect(hashPassword('')).rejects.toThrow(
        'Password is required and must be a string'
      )
    })

    it('should reject whitespace-only passwords', async () => {
      const whitespacePassword = '   \t\n   '

      await expect(hashPassword(whitespacePassword)).rejects.toThrow(
        'Password cannot be whitespace only'
      )
    })

    it('should reject null or undefined passwords', async () => {
      await expect(hashPassword(null as any)).rejects.toThrow(
        'Password is required and must be a string'
      )

      await expect(hashPassword(undefined as any)).rejects.toThrow(
        'Password is required and must be a string'
      )
    })

    it('should handle unicode characters correctly', async () => {
      const unicodePassword = 'mật khẩu123🔒'
      const hashedPassword = await hashPassword(unicodePassword)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(unicodePassword)
    })

    it('should handle passwords with whitespace', async () => {
      const passwordWithSpaces = 'my password 123'
      const hashedPassword = await hashPassword(passwordWithSpaces)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(passwordWithSpaces)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password successfully', async () => {
      const password = 'testPassword123'
      const hashedPassword = await hashPassword(password)

      const isValid = await verifyPassword(password, hashedPassword)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'testPassword123'
      const wrongPassword = 'wrongPassword456'
      const hashedPassword = await hashPassword(password)

      const isValid = await verifyPassword(wrongPassword, hashedPassword)
      expect(isValid).toBe(false)
    })

    it('should return false for invalid hash format', async () => {
      const password = 'testPassword123'
      const invalidHash = 'invalid_hash_format'

      const isValid = await verifyPassword(password, invalidHash)
      expect(isValid).toBe(false)
    })

    it('should return false for short invalid hash', async () => {
      const password = 'testPassword123'
      const shortHash = '$2b$10$abc'

      const isValid = await verifyPassword(password, shortHash)
      expect(isValid).toBe(false)
    })

    it('should reject null or undefined inputs', async () => {
      const validHash =
        '$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012345'

      await expect(verifyPassword(null as any, validHash)).rejects.toThrow(
        'Password is required and must be a string'
      )

      await expect(verifyPassword('password', null as any)).rejects.toThrow(
        'Hashed password is required and must be a string'
      )

      await expect(verifyPassword(undefined as any, validHash)).rejects.toThrow(
        'Password is required and must be a string'
      )

      await expect(
        verifyPassword('password', undefined as any)
      ).rejects.toThrow('Hashed password is required and must be a string')
    })

    it('should handle unicode characters in verification', async () => {
      const unicodePassword = 'mật khẩu123🔒'
      const hashedPassword = await hashPassword(unicodePassword)

      const isValid = await verifyPassword(unicodePassword, hashedPassword)
      expect(isValid).toBe(true)

      const isInvalid = await verifyPassword('wrong password', hashedPassword)
      expect(isInvalid).toBe(false)
    })

    it('should handle passwords with whitespace in verification', async () => {
      const passwordWithSpaces = 'my password 123'
      const hashedPassword = await hashPassword(passwordWithSpaces)

      const isValid = await verifyPassword(passwordWithSpaces, hashedPassword)
      expect(isValid).toBe(true)

      const isInvalid = await verifyPassword('mypassword123', hashedPassword)
      expect(isInvalid).toBe(false)
    })
  })
})
