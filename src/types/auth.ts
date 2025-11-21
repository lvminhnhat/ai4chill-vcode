import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      // Note: role field removed - not in database schema
    }
  }

  interface User {
    id: string
    email: string
    name: string | null
    // Note: role field removed - not in database schema
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    name: string | null
    // Note: role field removed - not in database schema
  }
}
