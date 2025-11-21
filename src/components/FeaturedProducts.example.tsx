import { FeaturedProducts } from './FeaturedProducts'

// Example 1: Default usage with mock data
export function FeaturedProductsDefault() {
  return <FeaturedProducts />
}

// Example 2: Custom title and description
export function FeaturedProductsCustomText() {
  return (
    <FeaturedProducts
      title="Ưu đãi đặc biệt"
      description="Các gói AI đang được giảm giá"
    />
  )
}

// Example 3: Custom products
export function FeaturedProductsCustomProducts() {
  const customProducts = [
    {
      id: 'special-chatgpt',
      title: 'ChatGPT Plus - 3 Months Special',
      price: 400000,
      originalPrice: 540000,
      rating: 4.9,
      image: '/images/products/chatgpt-special.jpg',
      stock: 5,
    },
    {
      id: 'bundle-claude-gemini',
      title: 'Claude Pro + Gemini Advanced Bundle',
      price: 300000,
      originalPrice: 360000,
      rating: 4.8,
      image: '/images/products/ai-bundle.jpg',
      stock: 8,
    },
    {
      id: 'midjourney-yearly',
      title: 'Midjourney Yearly Subscription',
      price: 1200000,
      originalPrice: 1500000,
      rating: 4.7,
      image: '/images/products/midjourney-yearly.jpg',
      stock: 2,
    },
  ]

  return <FeaturedProducts products={customProducts} />
}

// Example 4: Custom grid columns
export function FeaturedProductsCustomGrid() {
  return (
    <FeaturedProducts
      columns={{ mobile: 1, tablet: 2, desktop: 4 }}
      className="bg-gray-50"
    />
  )
}

// Example 5: Minimal featured products
export function FeaturedProductsMinimal() {
  const minimalProducts = [
    {
      id: 'chatgpt-basic',
      title: 'ChatGPT Plus - 1 Month',
      price: 150000,
      rating: 4.8,
      image: '/images/products/chatgpt.jpg',
      stock: 25,
    },
    {
      id: 'claude-basic',
      title: 'Claude Pro - 1 Month',
      price: 180000,
      rating: 4.7,
      image: '/images/products/claude.jpg',
      stock: 15,
    },
  ]

  return (
    <FeaturedProducts
      products={minimalProducts}
      title="Bắt đầu với AI"
      description="Chọn từ các gói phổ biến nhất"
      columns={{ mobile: 1, tablet: 2, desktop: 2 }}
    />
  )
}
