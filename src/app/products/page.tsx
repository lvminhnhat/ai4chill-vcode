import { Suspense } from 'react'
import { ProductGrid } from '@/components/product/ProductGrid'
import { ProductFilters } from '@/components/product/ProductFilters'
import { MOCK_PRODUCTS } from '@/data/mock-products'
import type { Product } from '@/types/product'

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    sort?: string
  }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  
  // Parse URL parameters
  const categoryParam = params.category?.split('+').filter(Boolean) || []
  const sortParam = params.sort || 'newest'

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
        <Suspense fallback={<div>Loading filters...</div>}>
          <ProductFilters />
        </Suspense>
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
