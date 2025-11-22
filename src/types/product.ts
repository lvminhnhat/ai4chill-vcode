export interface Product {
  id: string
  title: string
  price: number
  originalPrice?: number
  rating: number
  image: string
  stock: number
  category?: string
}

export interface CartItem {
  productId: string
  variantId?: string
  quantity: number
  priceSnapshot: number
  title: string
  image?: string
  stock: number
}
