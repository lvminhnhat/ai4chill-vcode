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
import {
  Plus,
  Search,
  Filter,
  Package,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
} from 'lucide-react'
import { getProducts } from '@/app/actions/product-actions'
import { ProductFormDialog } from '@/components/products/ProductFormDialog'
import { DeleteProductDialog } from '@/components/products/DeleteProductDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

export default async function AdminProductsPage() {
  await requireAdmin()
  const products = await getProducts()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-lg text-gray-600 mt-2">
            Manage your product catalog
          </p>
        </div>
        <ProductFormDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </ProductFormDialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product List</CardTitle>
              <CardDescription>
                View and manage all products in your inventory (
                {products.length} products)
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
          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products yet
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by adding your first product to the catalog.
              </p>
              <ProductFormDialog>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Product
                </Button>
              </ProductFormDialog>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price Range</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {product.name}
                        </Link>
                        <div className="text-sm text-gray-500">
                          ID: {product.id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {product.description || 'No description'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        ${product.priceRange.min.toFixed(2)}
                        {product.priceRange.max > product.priceRange.min && (
                          <> - ${product.priceRange.max.toFixed(2)}</>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {product._count.variants} variants
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product._count.variants > 0 ? 'default' : 'secondary'
                        }
                      >
                        {product._count.variants > 0
                          ? 'Active'
                          : 'Setup Required'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/products/${product.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <ProductFormDialog product={product}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Product
                            </ProductFormDialog>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <DeleteProductDialog
                              productId={product.id}
                              productName={product.name}
                              variantCount={product._count.variants}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DeleteProductDialog>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
