import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock dependencies before importing
const mockPrisma = {
  user: {
    findUnique: jest.fn() as any,
    create: jest.fn() as any,
  },
}

const mockHashPassword = jest.fn() as any

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

jest.mock('@/lib/password', () => ({
  hashPassword: mockHashPassword,
}))

jest.mock('@/lib/utils', () => ({
  isValidEmail: jest.fn((email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ),
}))

// Import after mocking
import { POST } from '@/app/api/auth/register/route'

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should register a user successfully', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    }

    const hashedPassword = 'hashed_password_123'
    const createdUser = {
      id: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
    }

    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockHashPassword.mockResolvedValue(hashedPassword)
    mockPrisma.user.create.mockResolvedValue(createdUser)

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Act
    const response = await POST(request as any)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.message).toBe('User registered successfully')
    expect(data.user).toEqual(createdUser)
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    })
    expect(mockHashPassword).toHaveBeenCalledWith('password123')
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })
  })

  it('should register a user without name', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      password: 'password123',
    }

    const createdUser = {
      id: 'user_123',
      email: 'test@example.com',
      name: null,
      role: 'USER',
    }

    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockHashPassword.mockResolvedValue('hashed_password')
    mockPrisma.user.create.mockResolvedValue(createdUser)

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Act
    const response = await POST(request as any)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.user.name).toBeNull()
  })

  it('should return 400 when email or password is missing', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      // password missing
    }

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Act
    const response = await POST(request as any)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Email and password are required')
  })

  it('should return 400 when email format is invalid', async () => {
    // Arrange
    const userData = {
      email: 'invalid-email',
      password: 'password123',
    }

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Act
    const response = await POST(request as any)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Invalid email format')
  })

  it('should return 400 when password is too short', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      password: '123', // too short
    }

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Act
    const response = await POST(request as any)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Password must be at least 8 characters long')
  })

  it('should return 400 when password is too long', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      password: 'a'.repeat(73), // too long (> 72)
    }

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Act
    const response = await POST(request as any)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Password must be less than 72 characters long')
  })

  it('should return 409 when user already exists', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      password: 'password123',
    }

    const existingUser = {
      id: 'existing_user',
      email: 'test@example.com',
      name: 'Existing User',
    }

    mockPrisma.user.findUnique.mockResolvedValue(existingUser)

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Act
    const response = await POST(request as any)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(409)
    expect(data.success).toBe(false)
    expect(data.message).toBe('User with this email already exists')
    expect(mockPrisma.user.create).not.toHaveBeenCalled()
  })

  it('should return 400 for invalid JSON', async () => {
    // Arrange
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Act
    const response = await POST(request as any)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Invalid JSON in request body')
  })

  it('should handle password hashing errors', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      password: 'password123',
    }

    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockHashPassword.mockRejectedValue(new Error('Password hashing failed'))

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Act
    const response = await POST(request as any)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Password hashing failed')
  })

  it('should handle database errors', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      password: 'password123',
    }

    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockHashPassword.mockResolvedValue('hashed_password')
    mockPrisma.user.create.mockRejectedValue(
      new Error('Database connection failed')
    )

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Act
    const response = await POST(request as any)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Internal server error')
  })

  it('should convert email to lowercase', async () => {
    // Arrange
    const userData = {
      email: 'TEST@EXAMPLE.COM',
      password: 'password123',
    }

    const createdUser = {
      id: 'user_123',
      email: 'test@example.com', // lowercase
      name: null,
      role: 'USER',
    }

    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockHashPassword.mockResolvedValue('hashed_password')
    mockPrisma.user.create.mockResolvedValue(createdUser)

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Act
    const response = await POST(request as any)

    // Assert
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    })
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com', // lowercase
        password: 'hashed_password',
        name: null,
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })
  })
})
