# FeaturedProducts Component

A responsive grid component for displaying featured AI products in the marketplace.

## Features

- Responsive grid layout (mobile: 1 column, tablet: 2 columns, desktop: 3-4 columns)
- Uses existing ProductCard component
- Customizable title and description
- Optional custom products data
- Configurable grid columns
- TypeScript support
- Fully tested

## Props

| Prop          | Type                                                  | Default                                | Description                  |
| ------------- | ----------------------------------------------------- | -------------------------------------- | ---------------------------- |
| `products`    | `Product[]`                                           | Mock AI products                       | Array of products to display |
| `title`       | `string`                                              | "Sản phẩm nổi bật"                     | Section heading              |
| `description` | `string`                                              | "Các tài khoản AI được yêu thích nhất" | Section description          |
| `columns`     | `{ mobile: number; tablet: number; desktop: number }` | `{ mobile: 1, tablet: 2, desktop: 3 }` | Grid columns configuration   |
| `className`   | `string`                                              | -                                      | Additional CSS classes       |

## Product Interface

```typescript
interface Product {
  id: string
  title: string
  price: number
  originalPrice?: number
  rating: number
  image: string
  stock: number
}
```

## Usage Examples

### Default Usage

```tsx
import { FeaturedProducts } from '@/components'

export default function HomePage() {
  return <FeaturedProducts />
}
```

### Custom Products

```tsx
const customProducts = [
  {
    id: 'chatgpt-plus',
    title: 'ChatGPT Plus - 1 Month',
    price: 150000,
    originalPrice: 180000,
    rating: 4.8,
    image: '/images/products/chatgpt.jpg',
    stock: 25
  }
]

<FeaturedProducts
  products={customProducts}
  title="Ưu đãi đặc biệt"
  description="Các gói AI đang được giảm giá"
/>
```

### Custom Grid Layout

```tsx
<FeaturedProducts
  columns={{ mobile: 1, tablet: 2, desktop: 4 }}
  className="bg-gray-50"
/>
```

## Mock Data

The component includes realistic mock data for AI accounts marketplace:

- ChatGPT Plus accounts
- Claude Pro accounts
- Midjourney subscriptions
- Gemini Advanced accounts
- DALL-E credits
- GitHub Copilot accounts

## Styling

- Uses Tailwind CSS classes
- Trust Blue section headings (`text-blue-600`)
- Responsive grid with generous gaps
- Section padding: `py-16`
- Center-aligned heading and description

## Testing

The component is fully tested with Jest and React Testing Library. Tests cover:

- Default rendering
- Custom props
- Product data display
- Grid layout
- Add to cart functionality
- Component structure

Run tests:

```bash
npm test -- --testPathPatterns=FeaturedProducts
```

## Dependencies

- React
- ProductCard component
- cn utility from `@/lib/utils`
- Tailwind CSS
