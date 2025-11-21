import { requireAuth, getCurrentUser } from '@/lib/session-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  // Protect this page - redirect to /auth/signin if not authenticated
  const session = await requireAuth()
  const user = await getCurrentUser()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.name || user?.email || 'User'}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening with your account today.
        </p>
      </div>

      {/* User Info Card */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Account Info</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Email:</span>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Name:</span>
                <p className="text-sm text-muted-foreground">{user?.name || 'Not set'}</p>
              </div>
              <div>
                <span className="text-sm font-medium">User ID:</span>
                <p className="text-sm text-muted-foreground font-mono text-xs">{user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Status</CardTitle>
            <CardDescription>Your session information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Status:</span>
                <p className="text-sm text-green-600 dark:text-green-400">✓ Active</p>
              </div>
              <div>
                <span className="text-sm font-medium">Session Type:</span>
                <p className="text-sm text-muted-foreground">JWT</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Dashboard overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Total Logins:</span>
                <p className="text-sm text-muted-foreground">127</p>
              </div>
              <div>
                <span className="text-sm font-medium">Last Login:</span>
                <p className="text-sm text-muted-foreground">Just now</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Protected Content</CardTitle>
          <CardDescription>
            This page is protected by middleware and session utilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This dashboard page is protected using:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li><code className="bg-muted px-1 py-0.5 rounded">requireAuth()</code> server-side protection</li>
              <li><code className="bg-muted px-1 py-0.5 rounded">middleware.ts</code> route protection</li>
              <li><code className="bg-muted px-1 py-0.5 rounded">NextAuth v5</code> session management</li>
              <li><code className="bg-muted px-1 py-0.5 rounded">JWT</code> strategy for scalability</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Try refreshing the page to test session persistence, or use the logout button in the header.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
