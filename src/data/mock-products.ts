import type { Product } from '@/components/FeaturedProducts'

/**
 * ⚠️ DEMO DATA - For development and preview only
 * DO NOT use in production
 *
 * This mock data represents AI accounts marketplace products
 * for demonstration purposes only.
 */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'ChatGPT Plus',
    price: 150000,
    originalPrice: 200000,
    rating: 4.8,
    image: '/images/products/chatgpt.jpg',
    stock: 50,
  },
  {
    id: '2',
    title: 'ChatGPT Team',
    price: 300000,
    originalPrice: 400000,
    rating: 4.9,
    image: '/images/products/chatgpt-team.jpg',
    stock: 30,
  },
  {
    id: '3',
    title: 'Claude API',
    price: 250000,
    rating: 4.7,
    image: '/images/products/claude-api.jpg',
    stock: 40,
  },
  {
    id: '4',
    title: 'Claude Pro',
    price: 180000,
    rating: 4.6,
    image: '/images/products/claude.jpg',
    stock: 45,
  },
  {
    id: '5',
    title: 'DALL-E',
    price: 120000,
    rating: 4.5,
    image: '/images/products/dalle.jpg',
    stock: 60,
  },
  {
    id: '6',
    title: 'Gemini Advanced',
    price: 220000,
    rating: 4.7,
    image: '/images/products/gemini.jpg',
    stock: 35,
  },
  {
    id: '7',
    title: 'GitHub Copilot',
    price: 280000,
    rating: 4.8,
    image: '/images/products/github-copilot.jpg',
    stock: 50,
  },
  {
    id: '8',
    title: 'Midjourney',
    price: 350000,
    rating: 4.9,
    image: '/images/products/midjourney.jpg',
    stock: 25,
  },
]

// Export both names for backward compatibility
export const mockProducts = MOCK_PRODUCTS
