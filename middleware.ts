import { auth } from './src/lib/auth'

export default auth(req => {
  // Handle protected routes with role-based authorization
  const { pathname } = req.nextUrl

  // Protect dashboard routes - require authentication
  if (pathname.startsWith('/dashboard') && !req.auth) {
    const newUrl = new URL('/auth/signin', req.nextUrl.origin)
    newUrl.searchParams.set('callbackUrl', pathname)
    return Response.redirect(newUrl)
  }

  // Protect admin routes - require authentication and ADMIN role
  if (pathname.startsWith('/admin')) {
    if (!req.auth) {
      const newUrl = new URL('/auth/signin', req.nextUrl.origin)
      newUrl.searchParams.set('callbackUrl', pathname)
      return Response.redirect(newUrl)
    }

    // Check if user has ADMIN role
    const userRole = req.auth.user?.role
    if (userRole !== 'ADMIN') {
      const newUrl = new URL('/dashboard', req.nextUrl.origin)
      return Response.redirect(newUrl)
    }
  }
})

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
