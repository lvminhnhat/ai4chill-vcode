# API Documentation

## Authentication Endpoints

### POST /api/auth/register

Registers a new user in the system.

#### Request Body

```json
{
  "email": "string (required)",
  "password": "string (required, 8-72 characters)",
  "name": "string (optional)"
}
```

#### Response

**Success (201 Created)**

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string | null",
    "role": "USER" | "ADMIN"
  }
}
```

**Error Responses**

**400 Bad Request** - Missing required fields or invalid input

```json
{
  "success": false,
  "message": "Email and password are required"
}
```

**400 Bad Request** - Invalid email format

```json
{
  "success": false,
  "message": "Invalid email format"
}
```

**400 Bad Request** - Password too short

```json
{
  "success": false,
  "message": "Password must be at least 8 characters long"
}
```

**400 Bad Request** - Password too long

```json
{
  "success": false,
  "message": "Password must be less than 72 characters long"
}
```

**400 Bad Request** - Invalid JSON

```json
{
  "success": false,
  "message": "Invalid JSON in request body"
}
```

**409 Conflict** - User already exists

```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

**500 Internal Server Error** - Server error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

#### Validation Rules

- **Email**: Must be a valid email format (checked with regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- **Password**:
  - Minimum 8 characters
  - Maximum 72 characters (bcrypt limitation)
  - Cannot be whitespace only
- **Name**: Optional, can be null
- **Email**: Converted to lowercase before storage

#### Security Features

- Passwords are hashed using bcrypt with 10 salt rounds
- Unique email constraint enforced at database level
- Input validation prevents common attack vectors
- Error messages don't leak sensitive information

#### Example Usage

```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123',
    name: 'John Doe',
  }),
})

const data = await response.json()

if (data.success) {
  console.log('User registered:', data.user)
} else {
  console.error('Registration failed:', data.message)
}
```
