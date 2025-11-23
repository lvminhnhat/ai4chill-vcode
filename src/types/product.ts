export interface Variant {
  id: string
  name: string
  price: number
  stock: number
}

export interface Product {
  id: string
  title: string
  slug: string
  price: number
  originalPrice?: number
  rating: number
  image: string
  stock: number
  category?: string
  description?: string
  variants?: Variant[]
}

export interface CartItem {
  productId: string
  variantId?: string // NEW - optional for backward compatibility
  variantName?: string // NEW - e.g., "1 Month", "6 Months"
  quantity: number
  priceSnapshot: number
  title: string
  image?: string
  stock: number
}
