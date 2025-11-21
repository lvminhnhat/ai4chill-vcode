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
}

export default nextConfig
