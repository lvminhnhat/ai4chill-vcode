import { requireAdmin } from '@/lib/session-utils'
import { getOrders } from '@/app/actions/order-actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Filter,
  Download,
  ShoppingCart,
  Calendar,
  User,
  Package,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react'
import Link from 'next/link'
import { OrderStatus } from '@/generated/prisma'

interface OrdersPageProps {
  searchParams: {
    status?: string
    search?: string
    page?: string
  }
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  PROCESSING: {
    label: 'Processing',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  SHIPPED: {
    label: 'Shipped',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-200',
  },
}

function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount))
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function truncateId(id: string, length = 8) {
  return `${id.slice(0, length)}...`
}

export default async function AdminOrdersPage({
  searchParams,
}: OrdersPageProps) {
  await requireAdmin()

  const filters = {
    status: searchParams.status as OrderStatus | undefined,
    searchQuery: searchParams.search,
    page: Number(searchParams.page) || 1,
    limit: 20,
  }

  const {
    orders,
    totalCount,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
  } = await getOrders(filters)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-lg text-gray-600 mt-2">
            Manage customer orders and fulfillment
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by order ID or customer email..."
                  className="pl-10"
                  name="search"
                  defaultValue={searchParams.search}
                />
              </div>
            </div>
            <Select name="status" defaultValue={searchParams.status}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">Apply Filters</Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order List</CardTitle>
              <CardDescription>
                {totalCount} order{totalCount !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchParams.search || searchParams.status
                  ? 'No orders found'
                  : 'No orders yet'}
              </h3>
              <p className="text-gray-600">
                {searchParams.search || searchParams.status
                  ? 'Try adjusting your filters or search terms.'
                  : 'Customer orders will appear here once they start making purchases.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-center">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map(order => {
                      const statusInfo = statusConfig[order.status]

                      return (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="font-mono text-sm hover:text-blue-600 hover:underline"
                            >
                              {truncateId(order.id)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                              {formatDate(order.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <User className="mr-2 h-4 w-4 text-gray-400" />
                              <div>
                                <p className="font-medium">
                                  {order.user.name || 'N/A'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {order.user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Package className="mr-2 h-4 w-4 text-gray-400" />
                              {order._count.orderItems}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(order.total.toString())}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusInfo.color}>
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/admin/orders/${order.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * 20 + 1} to{' '}
                    {Math.min(currentPage * 20, totalCount)} of {totalCount}{' '}
                    orders
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasPreviousPage}
                      asChild={hasPreviousPage}
                    >
                      {hasPreviousPage ? (
                        <Link
                          href={`?status=${searchParams.status || ''}&search=${searchParams.search || ''}&page=${currentPage - 1}`}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Link>
                      ) : (
                        <>
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </>
                      )}
                    </Button>

                    <div className="flex items-center space-x-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                pageNum === currentPage ? 'default' : 'outline'
                              }
                              size="sm"
                              asChild={pageNum !== currentPage}
                            >
                              {pageNum === currentPage ? (
                                <span>{pageNum}</span>
                              ) : (
                                <Link
                                  href={`?status=${searchParams.status || ''}&search=${searchParams.search || ''}&page=${pageNum}`}
                                >
                                  {pageNum}
                                </Link>
                              )}
                            </Button>
                          )
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasNextPage}
                      asChild={hasNextPage}
                    >
                      {hasNextPage ? (
                        <Link
                          href={`?status=${searchParams.status || ''}&search=${searchParams.search || ''}&page=${currentPage + 1}`}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      ) : (
                        <>
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
