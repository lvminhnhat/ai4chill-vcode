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
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  MoreHorizontal,
  AlertTriangle,
} from 'lucide-react'
import { getProductById } from '@/app/actions/product-actions'
import { getVariantStock } from '@/app/actions/inventory-actions'
import { VariantFormDialog } from '@/components/products/VariantFormDialog'
import { DeleteVariantDialog } from '@/components/products/DeleteVariantDialog'
import { AddStockDialog } from '@/components/inventory/AddStockDialog'
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
import { ProductWithVariants } from '@/types/product'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const productData = await getProductById(id)

  if (!productData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Product Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The product you're looking for doesn't exist.
          </p>
          <Link href="/admin/products">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const product: ProductWithVariants = {
    ...productData,
    price: Number(productData.price),
    variants: productData.variants.map(variant => ({
      ...variant,
      price: Number(variant.price),
    })),
  }

  // Get stock information for each variant
  const variantsWithStock = await Promise.all(
    product.variants.map(async variant => {
      const stock = await getVariantStock(variant.id)
      return {
        ...variant,
        stock: stock.available,
        totalStock: stock.total,
        soldStock: stock.sold,
      }
    })
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-lg text-gray-600 mt-1">
              Product ID: {product.id}
            </p>
          </div>
        </div>
      </div>

      {/* Product Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>Basic product details and pricing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Name</h3>
              <p className="text-lg font-semibold">{product.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Base Price
              </h3>
              <p className="text-lg font-semibold">
                ${product.price.toFixed(2)}
              </p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Description
              </h3>
              <p className="text-gray-700">
                {product.description || 'No description provided'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Created At
              </h3>
              <p className="text-gray-700">
                {new Date(product.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Last Updated
              </h3>
              <p className="text-gray-700">
                {new Date(product.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variants Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Variants</CardTitle>
              <CardDescription>
                Manage product variants and pricing options (
                {product.variants.length} variants)
              </CardDescription>
            </div>
            <VariantFormDialog productId={product.id}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Variant
              </Button>
            </VariantFormDialog>
          </div>
        </CardHeader>
        <CardContent>
          {product.variants.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No variants yet
              </h3>
              <p className="text-gray-600 mb-6">
                Add variants to offer different pricing options and durations
                for this product.
              </p>
              <VariantFormDialog productId={product.id}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Variant
                </Button>
              </VariantFormDialog>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variantsWithStock.map(variant => (
                  <TableRow key={variant.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{variant.name}</div>
                        <div className="text-sm text-gray-500">
                          ID: {variant.id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        ${variant.price.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{variant.duration}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              variant.stock > 0 ? 'default' : 'destructive'
                            }
                          >
                            {variant.stock} available
                          </Badge>
                          {variant.stock <= 5 && variant.stock > 0 && (
                            <Badge
                              variant="outline"
                              className="text-yellow-700 border-yellow-300"
                            >
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Low
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {variant.totalStock} total • {variant.soldStock} sold
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={variant.stock > 0 ? 'default' : 'secondary'}
                      >
                        {variant.stock > 0 ? 'Available' : 'Out of Stock'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <AddStockDialog
                          variantId={variant.id}
                          variantName={variant.name}
                          productName={product.name}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <VariantFormDialog
                                productId={product.id}
                                variant={variant}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </VariantFormDialog>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <DeleteVariantDialog
                                variantId={variant.id}
                                variantName={variant.name}
                                productId={product.id}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DeleteVariantDialog>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
