import { auth } from './src/lib/auth'

export default auth(req => {
  // Handle protected routes with authentication
  const { pathname } = req.nextUrl

  // Redirect authenticated users away from auth pages
  // If user is already logged in, they shouldn't access signin/login/register pages
  const authRoutes = ['/auth/signin', '/auth/login', '/auth/register']
  if (authRoutes.includes(pathname) && req.auth) {
    const newUrl = new URL('/dashboard', req.nextUrl.origin)
    return Response.redirect(newUrl)
  }

  // Protect dashboard routes - require authentication
  if (pathname.startsWith('/dashboard') && !req.auth) {
    const newUrl = new URL('/auth/signin', req.nextUrl.origin)
    newUrl.searchParams.set('callbackUrl', pathname)
    return Response.redirect(newUrl)
  }

  // Note: Admin routes protection removed - no role field in database
  // If you need admin routes in the future, add role field to schema first
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/signin',
    '/auth/login',
    '/auth/register',
  ],
}
