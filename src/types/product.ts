export interface Variant {
  id: string
  name: string
  price: number
  duration: string
  stock: number
  productId: string
  createdAt: Date
  updatedAt: Date
}

export interface ProductWithVariants {
  id: string
  name: string
  description: string | null
  price: number
  createdAt: Date
  updatedAt: Date
  variants: Variant[]
}
