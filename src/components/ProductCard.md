# ProductCard Component

A reusable e-commerce product card component built with React, TypeScript, and Tailwind CSS.

## Features

- ✅ Product image with Next.js optimization
- ✅ Product title with truncation
- ✅ Price display with optional discount
- ✅ 5-star rating system
- ✅ Stock status badges (In Stock/Low Stock/Out of Stock)
- ✅ Add to Cart button
- ✅ Hover effects and transitions
- ✅ Responsive design
- ✅ TypeScript support
- ✅ Accessible markup

## Props

```typescript
interface ProductCardProps {
  id: string
  title: string
  price: number
  originalPrice?: number // For showing discounts
  rating: number // 0-5 rating
  image: string // Image URL
  stock: number // Current stock quantity
  onAddToCart?: (id: string) => void // Optional callback
}
```

## Usage

```tsx
import { ProductCard } from '@/components/ProductCard'

;<ProductCard
  id="1"
  title="Wireless Headphones"
  price={299000}
  originalPrice={399000}
  rating={4.5}
  image="/products/headphones.jpg"
  stock={15}
  onAddToCart={id => console.log('Added:', id)}
/>
```

## Stock Status

- **In Stock**: `stock > 5` (Green badge)
- **Low Stock**: `stock <= 5` (Yellow badge)
- **Out of Stock**: `stock = 0` (Red badge, disabled button)

## Design System

- Uses shadcn/ui Card and Button components
- Follows Trust Blue color palette
- Inter font family
- Responsive grid layout
- Hover: scale and shadow effects

## Testing

Component includes comprehensive unit tests covering:

- Product information display
- Rating rendering
- Discount calculation
- Stock status handling
- Button interactions

Run tests: `npm test -- --testPathPatterns=ProductCard`
