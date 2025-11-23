import {
  encryptCredentials,
  decryptCredentials,
  validateCredentialsFormat,
} from '@/lib/encryption'

describe('Encryption Utility', () => {
  const testCredentials = {
    email: 'test@example.com',
    password: 'password123',
  }

  describe('encryptCredentials and decryptCredentials', () => {
    it('should encrypt and decrypt credentials correctly', () => {
      const encrypted = encryptCredentials(testCredentials)
      const decrypted = decryptCredentials(encrypted)

      expect(decrypted).toEqual(testCredentials)
    })

    it('should produce different encrypted values for same input', () => {
      const encrypted1 = encryptCredentials(testCredentials)
      const encrypted2 = encryptCredentials(testCredentials)

      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should throw error for invalid encrypted data', () => {
      expect(() => {
        decryptCredentials('invalid-encrypted-data')
      }).toThrow('Failed to decrypt credentials')
    })
  })

  describe('validateCredentialsFormat', () => {
    it('should validate correct format', () => {
      const text = `user1@example.com:password1
user2@example.com:password2
user3@example.com:password3`

      const result = validateCredentialsFormat(text)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        email: 'user1@example.com',
        password: 'password1',
      })
      expect(result[1]).toEqual({
        email: 'user2@example.com',
        password: 'password2',
      })
      expect(result[2]).toEqual({
        email: 'user3@example.com',
        password: 'password3',
      })
    })

    it('should handle empty lines and whitespace', () => {
      const text = `user1@example.com:password1

user2@example.com:password2

`

      const result = validateCredentialsFormat(text)

      expect(result).toHaveLength(2)
    })

    it('should reject invalid email format', () => {
      const text = `invalid-email:password
user@example.com:password`

      expect(() => {
        validateCredentialsFormat(text)
      }).toThrow('Line 1: Invalid email format')
    })

    it('should reject invalid format (missing colon)', () => {
      const text = `userexample.compassword
user@example.com:password`

      expect(() => {
        validateCredentialsFormat(text)
      }).toThrow('Line 1: Invalid format. Expected "email:password"')
    })

    it('should reject empty password', () => {
      const text = `user@example.com:
user2@example.com:password`

      expect(() => {
        validateCredentialsFormat(text)
      }).toThrow('Line 1: Password cannot be empty')
    })

    it('should handle multiple errors', () => {
      const text = `invalid-email:password
user@example.com:
user2@example.com:password`

      expect(() => {
        validateCredentialsFormat(text)
      }).toThrow(
        /Line 1: Invalid email format.*Line 2: Password cannot be empty/s
      )
    })
  })
})
