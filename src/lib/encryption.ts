import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required')
}

// Ensure the key is exactly 32 bytes (64 hex characters)
const key = Buffer.from(ENCRYPTION_KEY, 'hex')
if (key.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)')
}

export interface Credentials {
  email: string
  password: string
}

export function encryptCredentials(data: Credentials): string {
  try {
    const iv = crypto.randomBytes(16) // Initialization vector
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Combine iv + authTag + encrypted data
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')])
    return combined.toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt credentials')
  }
}

export function decryptCredentials(encrypted: string): Credentials {
  try {
    const combined = Buffer.from(encrypted, 'base64')

    const iv = combined.slice(0, 16)
    const authTag = combined.slice(16, 32)
    const encryptedData = combined.slice(32).toString('hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return JSON.parse(decrypted) as Credentials
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt credentials')
  }
}

export function validateCredentialsFormat(
  credentialsText: string
): Credentials[] {
  const lines = credentialsText.trim().split('\n')
  const credentials: Credentials[] = []
  const errors: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.split(':')
    if (parts.length !== 2) {
      errors.push(`Line ${i + 1}: Invalid format. Expected "email:password"`)
      continue
    }

    const [email, password] = parts.map(part => part.trim())

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      errors.push(`Line ${i + 1}: Invalid email format`)
      continue
    }

    if (password.length < 1) {
      errors.push(`Line ${i + 1}: Password cannot be empty`)
      continue
    }

    credentials.push({ email, password })
  }

  if (errors.length > 0) {
    throw new Error(`Validation errors:\n${errors.join('\n')}`)
  }

  return credentials
}
