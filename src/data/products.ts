import { MOCK_PRODUCTS } from './mock-products'
import { USE_MOCK_DATA } from '@/lib/feature-flags'
import type { Product } from '@/components/FeaturedProducts'

/**
 * Get products data with feature flag support
 *
 * In development: Uses mock data when NEXT_PUBLIC_USE_MOCK_DATA=true
 * In production: Will fetch from real API (when implemented)
 *
 * @returns Promise<Product[]> Array of products
 */
export async function getProducts(): Promise<Product[]> {
  // Feature flag for mock data usage
  if (USE_MOCK_DATA) {
    return MOCK_PRODUCTS
  }

  // Future: Real API call
  // const response = await fetch('/api/products')
  // if (!response.ok) {
  //   throw new Error('Failed to fetch products')
  // }
  // return response.json()

  // Fallback to mock data for now
  return MOCK_PRODUCTS
}

/**
 * Get a single product by ID
 *
 * @param id - Product ID
 * @returns Promise<Product | null> Product or null if not found
 */
export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts()
  return products.find(product => product.id === id) || null
}
