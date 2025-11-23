import { requireAdmin } from '@/lib/session-utils'
import { getOrderStats } from '@/app/actions/order-actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Package,
  ShoppingCart,
  Boxes,
  LayoutDashboard,
  DollarSign,
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const session = await requireAdmin()

  const orderStats = await getOrderStats()

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-lg text-gray-600 mt-2">
          Welcome back, {session.user.name || session.user.email}!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No products yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orderStats.stats?.totalOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {orderStats.stats?.pendingOrders || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Items
            </CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">All items in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Number(orderStats.stats?.totalRevenue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From {orderStats.stats?.paidOrders || 0} paid orders
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="/admin/products"
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Package className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-medium">Manage Products</h3>
                <p className="text-sm text-gray-600">
                  Add, edit, or remove products
                </p>
              </a>
              <a
                href="/admin/orders"
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ShoppingCart className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-medium">View Orders</h3>
                <p className="text-sm text-gray-600">Manage customer orders</p>
              </a>
              <a
                href="/admin/inventory"
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Boxes className="h-8 w-8 text-purple-600 mb-2" />
                <h3 className="font-medium">Inventory</h3>
                <p className="text-sm text-gray-600">Track stock levels</p>
              </a>
              <div className="p-4 border rounded-lg bg-gray-50">
                <LayoutDashboard className="h-8 w-8 text-gray-400 mb-2" />
                <h3 className="font-medium text-gray-600">Analytics</h3>
                <p className="text-sm text-gray-500">Coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database</span>
              <span className="text-sm text-green-600">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Authentication</span>
              <span className="text-sm text-green-600">Working</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Admin Access</span>
              <span className="text-sm text-green-600">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Backup</span>
              <span className="text-sm text-gray-600">Never</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
