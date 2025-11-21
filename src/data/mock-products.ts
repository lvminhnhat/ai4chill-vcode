import type { Product } from '@/components/FeaturedProducts'

/**
 * ⚠️ DEMO DATA - For development and preview only
 * DO NOT use in production
 *
 * This mock data represents AI accounts marketplace products
 * for demonstration purposes only.
 */
export const mockProducts: Product[] = [
  {
    id: 'chatgpt-plus-1m',
    title: 'ChatGPT Plus Subscription - 1 Month',
    price: 150000,
    originalPrice: 180000,
    rating: 4.8,
    image: '/images/products/chatgpt.jpg',
    stock: 25,
  },
  {
    id: 'claude-pro-1m',
    title: 'Claude Pro Account - 1 Month',
    price: 180000,
    rating: 4.7,
    image: '/images/products/claude.jpg',
    stock: 15,
  },
  {
    id: 'midjourney-basic',
    title: 'Midjourney Basic Plan - 1 Month',
    price: 120000,
    originalPrice: 150000,
    rating: 4.6,
    image: '/images/products/midjourney.jpg',
    stock: 8,
  },
  {
    id: 'gemini-advanced',
    title: 'Gemini Advanced Subscription - 1 Month',
    price: 140000,
    rating: 4.5,
    image: '/images/products/gemini.jpg',
    stock: 32,
  },
  {
    id: 'dalle-credits-100',
    title: 'DALL-E Credits - 100 Generations',
    price: 200000,
    originalPrice: 250000,
    rating: 4.9,
    image: '/images/products/dalle.jpg',
    stock: 5,
  },
  {
    id: 'github-copilot-1m',
    title: 'GitHub Copilot Individual - 1 Month',
    price: 130000,
    rating: 4.7,
    image: '/images/products/github-copilot.jpg',
    stock: 18,
  },
  {
    id: 'chatgpt-team-1m',
    title: 'ChatGPT Team Subscription - 1 Month',
    price: 350000,
    rating: 4.8,
    image: '/images/products/chatgpt-team.jpg',
    stock: 12,
  },
  {
    id: 'claude-api-credits',
    title: 'Claude API Credits - $50 Worth',
    price: 500000,
    rating: 4.6,
    image: '/images/products/claude-api.jpg',
    stock: 3,
  },
]
