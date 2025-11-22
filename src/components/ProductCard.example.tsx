// Example usage of ProductCard component
// This file demonstrates how to use the ProductCard component

import { ProductCard } from '@/components/ProductCard'

const ExampleUsage = () => {
  const handleAddToCart = (productId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Added to cart:', productId)
    }
    // Add your cart logic here
  }

  const sampleProducts = [
    {
      id: '1',
      title: 'Wireless Bluetooth Headphones',
      price: 299000,
      originalPrice: 399000,
      rating: 4.5,
      image: '/products/headphones.jpg',
      stock: 15,
    },
    {
      id: '2',
      title: 'Smart Watch Series 5',
      price: 599000,
      rating: 4.8,
      image: '/products/smartwatch.jpg',
      stock: 3,
    },
    {
      id: '3',
      title: 'Laptop Stand Adjustable',
      price: 149000,
      rating: 4.2,
      image: '/products/laptop-stand.jpg',
      stock: 0,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {sampleProducts.map(product => (
        <ProductCard
          key={product.id}
          {...product}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  )
}

export default ExampleUsage
