import { ProductGrid } from '@/components/product/ProductGrid'
import { ProductFilters } from '@/components/product/ProductFilters'
import { MOCK_PRODUCTS } from '@/data/mock-products'
import type { Product } from '@/types/product'

interface ProductsPageProps {
  searchParams: {
    category?: string
    sort?: string
  }
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  // Parse URL parameters
  const categoryParam = searchParams.category?.split('+').filter(Boolean) || []
  const sortParam = searchParams.sort || 'newest'

  // Filter products by category
  let filteredProducts = MOCK_PRODUCTS.filter(product => {
    if (categoryParam.length === 0) return true
    return product.category && categoryParam.includes(product.category)
  })

  // Sort products
  const sortedProducts = [...filteredProducts].sort(
    (a: Product, b: Product) => {
      switch (sortParam) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'newest':
        default:
          // For demo purposes, sort by id (assuming newer products have higher ids)
          return parseInt(b.id) - parseInt(a.id)
      }
    }
  )

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Filters Sidebar */}
      <aside className="w-full lg:w-80 flex-shrink-0">
        <ProductFilters />
      </aside>

      {/* Products Grid */}
      <div className="flex-1">
        <ProductGrid
          products={sortedProducts}
          columns={{ mobile: 1, tablet: 2, desktop: 3 }}
        />
      </div>
    </div>
  )
}
