import { auth } from './src/lib/auth'

export default auth(req => {
  // Handle protected routes with authentication and authorization
  const { pathname } = req.nextUrl

  // Redirect authenticated users away from auth pages
  // If user is already logged in, they shouldn't access signin/login/register pages
  const authRoutes = ['/auth/signin', '/auth/login', '/auth/register']
  if (authRoutes.includes(pathname) && req.auth) {
    const newUrl = new URL('/dashboard', req.nextUrl.origin)
    return Response.redirect(newUrl)
  }

  // Protect admin routes - require authentication AND ADMIN role
  // Issue #28: Add RBAC protection for /admin routes
  if (pathname.startsWith('/admin')) {
    if (!req.auth) {
      // Unauthenticated users -> redirect to signin
      const newUrl = new URL('/auth/signin', req.nextUrl.origin)
      newUrl.searchParams.set('callbackUrl', pathname)
      return Response.redirect(newUrl)
    }

    if ((req.auth as any)?.user?.role !== 'ADMIN') {
      // Authenticated but non-admin users -> redirect to dashboard
      const newUrl = new URL('/dashboard', req.nextUrl.origin)
      newUrl.searchParams.set('error', 'access_denied')
      newUrl.searchParams.set('message', 'Admin access required')
      return Response.redirect(newUrl)
    }
  }

  // Protect dashboard routes - require authentication
  if (pathname.startsWith('/dashboard') && !req.auth) {
    const newUrl = new URL('/auth/signin', req.nextUrl.origin)
    newUrl.searchParams.set('callbackUrl', pathname)
    return Response.redirect(newUrl)
  }
})

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/auth/signin',
    '/auth/login',
    '/auth/register',
  ],
}
