import type { Product } from '@/types/product'

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
    slug: 'chatgpt-plus',
    price: 150000,
    originalPrice: 200000,
    rating: 4.8,
    image: '/images/products/chatgpt.jpg',
    stock: 50,
    category: 'AI Chat',
    description:
      'Access to GPT-4, faster response times, priority access during peak hours, and advanced features like browsing, data analysis, and image generation.',
    variants: [
      { id: 'v1-1', name: '1 Month', price: 150000, stock: 10 },
      { id: 'v1-3', name: '3 Months', price: 400000, stock: 5 },
      { id: 'v1-6', name: '6 Months', price: 750000, stock: 0 },
    ],
  },
  {
    id: '2',
    title: 'ChatGPT Team',
    slug: 'chatgpt-team',
    price: 300000,
    originalPrice: 400000,
    rating: 4.9,
    image: '/images/products/chatgpt-team.jpg',
    stock: 30,
    category: 'AI Chat',
    description:
      'Collaborative workspace for teams with higher limits, admin controls, and team management features.',
    variants: [
      { id: 'v2-1', name: '1 Month', price: 300000, stock: 8 },
      { id: 'v2-3', name: '3 Months', price: 800000, stock: 3 },
      { id: 'v2-6', name: '6 Months', price: 1500000, stock: 2 },
    ],
  },
  {
    id: '3',
    title: 'Claude API',
    slug: 'claude-api',
    price: 250000,
    rating: 4.7,
    image: '/images/products/claude-api.jpg',
    stock: 40,
    category: 'AI Chat',
    description:
      "Access to Claude's powerful API for developers with high throughput and advanced capabilities.",
    variants: [
      { id: 'v3-1', name: '1 Month', price: 250000, stock: 15 },
      { id: 'v3-3', name: '3 Months', price: 650000, stock: 8 },
      { id: 'v3-6', name: '6 Months', price: 1200000, stock: 4 },
    ],
  },
  {
    id: '4',
    title: 'Claude Pro',
    slug: 'claude-pro',
    price: 180000,
    rating: 4.6,
    image: '/images/products/claude.jpg',
    stock: 45,
    category: 'AI Chat',
    description:
      'Enhanced Claude experience with higher usage limits, priority access, and advanced features.',
    variants: [
      { id: 'v4-1', name: '1 Month', price: 180000, stock: 12 },
      { id: 'v4-3', name: '3 Months', price: 480000, stock: 6 },
      { id: 'v4-6', name: '6 Months', price: 900000, stock: 3 },
    ],
  },
  {
    id: '5',
    title: 'DALL-E',
    slug: 'dalle',
    price: 120000,
    rating: 4.5,
    image: '/images/products/dalle.jpg',
    stock: 60,
    category: 'AI Art',
    description:
      "Create stunning images from text descriptions with DALL-E's advanced AI image generation.",
    variants: [
      { id: 'v5-1', name: '1 Month', price: 120000, stock: 20 },
      { id: 'v5-3', name: '3 Months', price: 320000, stock: 10 },
      { id: 'v5-6', name: '6 Months', price: 600000, stock: 5 },
    ],
  },
  {
    id: '6',
    title: 'Gemini Advanced',
    slug: 'gemini-advanced',
    price: 220000,
    rating: 4.7,
    image: '/images/products/gemini.jpg',
    stock: 35,
    category: 'AI Chat',
    description:
      "Google's most advanced AI model with multimodal capabilities and enhanced reasoning.",
    variants: [
      { id: 'v6-1', name: '1 Month', price: 220000, stock: 18 },
      { id: 'v6-3', name: '3 Months', price: 580000, stock: 9 },
      { id: 'v6-6', name: '6 Months', price: 1100000, stock: 4 },
    ],
  },
  {
    id: '7',
    title: 'GitHub Copilot',
    slug: 'github-copilot',
    price: 280000,
    rating: 4.8,
    image: '/images/products/github-copilot.jpg',
    stock: 50,
    category: 'AI Coding',
    description:
      'AI pair programmer that helps you write code faster and with fewer bugs.',
    variants: [
      { id: 'v7-1', name: '1 Month', price: 280000, stock: 25 },
      { id: 'v7-3', name: '3 Months', price: 750000, stock: 12 },
      { id: 'v7-6', name: '6 Months', price: 1400000, stock: 6 },
    ],
  },
  {
    id: '8',
    title: 'Midjourney',
    slug: 'midjourney',
    price: 350000,
    rating: 4.9,
    image: '/images/products/midjourney.jpg',
    stock: 25,
    category: 'AI Art',
    description:
      "Create breathtaking AI art with Midjourney's advanced image generation capabilities.",
    variants: [
      { id: 'v8-1', name: '1 Month', price: 350000, stock: 10 },
      { id: 'v8-3', name: '3 Months', price: 950000, stock: 5 },
      { id: 'v8-6', name: '6 Months', price: 1800000, stock: 2 },
    ],
  },
]

// Export both names for backward compatibility
export const mockProducts = MOCK_PRODUCTS
