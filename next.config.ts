import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Configure webpack aliases for fallback when Turbopack is not used
  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    }
    return config
  },
  // Empty turbopack config to silence the warning and use default behavior
  turbopack: {},
  // Configure image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Allow multiple quality values for optimization
    unoptimized: false,
  },
}

export default nextConfig
