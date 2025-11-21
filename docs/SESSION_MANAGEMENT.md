# Session Management & Protected Routes

Tài liệu này mô tả cách hoạt động của session management và protected routes trong hệ thống authentication.

## Tổng quan

Hệ thống sử dụng **NextAuth v5** với **JWT strategy** để quản lý session và bảo vệ routes.

## Kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                  AUTHENTICATION FLOW                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. User login → NextAuth API                           │
│  2. Credentials verified → JWT token created            │
│  3. Session stored in cookie                            │
│  4. Middleware checks auth on every request             │
│  5. Protected routes require valid session              │
│  6. Logout clears session cookie                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. Middleware (`/middleware.ts`)

Middleware tự động chạy trước mỗi request và kiểm tra authentication status.

**Chức năng:**
- ✅ Bảo vệ protected routes (`/dashboard`, `/admin`)
- ✅ Redirect unauthenticated users → `/auth/signin`
- ✅ Redirect authenticated users khỏi auth pages
- ✅ Role-based access control (ADMIN role)

**Routes được protect:**
```typescript
matcher: [
  '/dashboard/:path*',  // Yêu cầu authentication
  '/admin/:path*',      // Yêu cầu authentication + ADMIN role
  '/auth/signin',       // Redirect nếu đã đăng nhập
  '/auth/login',        // Redirect nếu đã đăng nhập
  '/auth/register',     // Redirect nếu đã đăng nhập
]
```

**Logic flow:**

```typescript
// 1. Authenticated users không được vào auth pages
if (authRoutes.includes(pathname) && req.auth) {
  return redirect('/dashboard')
}

// 2. Protected routes yêu cầu authentication
if (pathname.startsWith('/dashboard') && !req.auth) {
  return redirect('/auth/signin?callbackUrl=' + pathname)
}

// 3. Admin routes yêu cầu ADMIN role
if (pathname.startsWith('/admin')) {
  if (!req.auth) return redirect('/auth/signin')
  if (req.auth.user.role !== 'ADMIN') return redirect('/dashboard')
}
```

### 2. Session Utilities (`/src/lib/session-utils.ts`)

Bộ công cụ để làm việc với session trong server components và API routes.

**Functions:**

#### `getServerSession()`
Lấy session hiện tại từ server-side.

```typescript
const session = await getServerSession()
if (session) {
  console.log('User:', session.user.email)
}
```

#### `requireAuth()`
Bảo vệ server components - redirect nếu chưa đăng nhập.

```typescript
export default async function DashboardPage() {
  const session = await requireAuth() // Auto redirect nếu chưa login
  // Code here chỉ chạy khi đã authenticated
}
```

#### `getCurrentUser()`
Lấy user object từ session.

```typescript
const user = await getCurrentUser()
console.log('User ID:', user?.id)
console.log('User role:', user?.role)
```

#### `isAdmin(user)`
Type guard kiểm tra admin role.

```typescript
const user = await getCurrentUser()
if (user && isAdmin(user)) {
  // Admin-only logic
}
```

#### `requireAdmin()`
Bảo vệ admin-only routes.

```typescript
export default async function AdminPage() {
  const session = await requireAdmin() // Redirect nếu không phải admin
  // Admin-only code
}
```

### 3. LogoutButton Component (`/src/components/LogoutButton.tsx`)

Client component để logout user.

**Features:**
- ✅ Chỉ hiện khi user đã authenticated
- ✅ Loading state với spinner
- ✅ Error handling
- ✅ Customizable (variant, size, redirect URL)

**Usage:**

```tsx
// Basic
<LogoutButton />

// Custom style và redirect
<LogoutButton 
  variant="outline" 
  redirectTo="/login"
  children="Đăng xuất"
/>

// Icon button
<LogoutButton 
  variant="ghost" 
  size="icon"
  showIcon={true}
/>
```

### 4. Header Component (`/src/components/Header.tsx`)

Global header với user info và logout button.

**Features:**
- ✅ Hiển thị user email/name
- ✅ Tích hợp LogoutButton
- ✅ Responsive design
- ✅ Dark mode support

## Testing Guide

### Test 1: Protected Routes

```bash
# User chưa đăng nhập truy cập dashboard
curl http://localhost:3000/dashboard
# → Redirect to /auth/signin
```

### Test 2: Authenticated User Redirect

```bash
# User đã đăng nhập truy cập login page
curl -b "session_cookie" http://localhost:3000/auth/login
# → Redirect to /dashboard
```

### Test 3: Session Persistence

```bash
# 1. Login
# 2. Refresh page
# → Session vẫn tồn tại (JWT in cookie)
```

### Test 4: Logout Flow

```bash
# 1. Click LogoutButton
# 2. Session cleared
# 3. Redirect to home
# → Cannot access /dashboard anymore
```

## Security Features

### 1. JWT Strategy
- ✅ Stateless authentication
- ✅ Scalable (không cần database lookups)
- ✅ httpOnly cookies (chống XSS)
- ✅ Secure flag trong production

### 2. Cookie Configuration

```typescript
cookies: {
  sessionToken: {
    name: 'next-auth.session-token',
    options: {
      httpOnly: true,   // Chống XSS attacks
      sameSite: 'lax',  // CSRF protection
      path: '/',
      secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    },
  },
}
```

### 3. Rate Limiting
- Login attempts giới hạn: 100 requests/phút
- Chống brute force attacks

### 4. Callback URL Preservation

```typescript
// User truy cập /dashboard/settings mà chưa login
// → Redirect to /auth/signin?callbackUrl=/dashboard/settings
// → Sau khi login thành công → redirect về /dashboard/settings
```

## Best Practices

### 1. Server Components (Recommended)

```typescript
// ✅ GOOD: Use requireAuth() trong server components
export default async function ProfilePage() {
  const session = await requireAuth()
  return <div>Welcome {session.user.email}</div>
}
```

### 2. Client Components

```typescript
// ✅ GOOD: Use useSession() hook
'use client'
import { useSession } from 'next-auth/react'

export function UserInfo() {
  const { data: session } = useSession()
  if (!session) return <div>Not logged in</div>
  return <div>{session.user.email}</div>
}
```

### 3. API Routes

```typescript
// ✅ GOOD: Check auth trong API routes
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  // Protected API logic
}
```

## Troubleshooting

### Session không persist sau refresh

**Giải pháp:**
- Kiểm tra cookie settings
- Verify NEXTAUTH_SECRET trong `.env`
- Check browser không block cookies

### Middleware không redirect

**Giải pháp:**
- Verify matcher config trong `middleware.ts`
- Check route path chính xác
- Restart dev server

### "NEXT_REDIRECT" error

**Giải pháp:**
- Đây là **behavior bình thường** khi middleware redirect
- Không phải lỗi, là cách Next.js handle redirects

## Performance

### Middleware Performance
- ✅ Chỉ chạy cho routes trong `matcher`
- ✅ JWT validation rất nhanh (không cần database)
- ✅ Không block static assets

### Session Caching
- NextAuth tự động cache session
- Client-side session được cache trong React context

## Acceptance Criteria (Issue #12)

- [x] Middleware protect các routes cần authentication
- [x] Unauthenticated users redirect đến login page
- [x] Authenticated users không thể access login/register
- [x] Session utilities hoạt động đúng (server + client)
- [x] Logout button hoạt động và clear session
- [x] Session persist sau refresh page
- [x] Middleware performance tốt (không block requests)
- [x] Edge cases được handle (expired session, invalid token)

## References

- NextAuth v5 Docs: https://authjs.dev
- Next.js Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
- JWT Strategy: https://jwt.io/introduction

---

**Last updated:** 2025-11-21  
**Issue:** #12 - [STORY-02-01] Add session management và protected routes
