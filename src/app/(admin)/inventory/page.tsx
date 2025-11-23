import { requireAdmin } from '@/lib/session-utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AddStockDialog } from '@/components/inventory/AddStockDialog'
import {
  getAllInventory,
  getInventorySummary,
} from '@/app/actions/inventory-actions'
import {
  Search,
  Filter,
  AlertTriangle,
  Package,
  Boxes,
  Plus,
} from 'lucide-react'
import Link from 'next/link'

export default async function AdminInventoryPage() {
  await requireAdmin()

  const [inventory, summary] = await Promise.all([
    getAllInventory(),
    getInventorySummary(),
  ])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-lg text-gray-600 mt-2">
            Manage stock levels and inventory tracking
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products">
            <Package className="mr-2 h-4 w-4" />
            Manage Products
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalSold} sold • {summary.totalAvailable} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {summary.lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Items with ≤5 units left
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.outOfStockCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Items completely sold out
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                Track and manage product inventory levels
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Boxes className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No inventory items
              </h3>
              <p className="text-gray-600 mb-6">
                Add products to your catalog to start tracking inventory.
              </p>
              <Button asChild>
                <Link href="/admin/products">
                  <Package className="mr-2 h-4 w-4" />
                  Add Products to Inventory
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {inventory.map(variant => (
                <div key={variant.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {variant.product.name}
                        </h3>
                        <Badge variant="secondary">{variant.name}</Badge>
                        <Badge variant="outline">{variant.duration}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        ${variant.price.toFixed(2)}
                      </p>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-lg font-semibold text-gray-900">
                            {variant.stock.total}
                          </div>
                          <div className="text-xs text-gray-600">Total</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="text-lg font-semibold text-green-700">
                            {variant.stock.available}
                          </div>
                          <div className="text-xs text-green-600">
                            Available
                          </div>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded">
                          <div className="text-lg font-semibold text-red-700">
                            {variant.stock.sold}
                          </div>
                          <div className="text-xs text-red-600">Sold</div>
                        </div>
                      </div>

                      {variant.stock.available <= 5 &&
                        variant.stock.available > 0 && (
                          <Badge
                            variant="outline"
                            className="text-yellow-700 border-yellow-300"
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Low Stock
                          </Badge>
                        )}
                      {variant.stock.available === 0 &&
                        variant.stock.total > 0 && (
                          <Badge variant="destructive">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Out of Stock
                          </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                      <AddStockDialog
                        variantId={variant.id}
                        variantName={variant.name}
                        productName={variant.product.name}
                      />
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/products/${variant.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
