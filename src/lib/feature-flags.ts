/**
 * Feature flags for the application
 *
 * These flags control which features are enabled in different environments
 */

export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true'

export const ENABLE_DEBUG_MODE = process.env.NODE_ENV === 'development'

export const ENABLE_ANALYTICS = process.env.NODE_ENV === 'production'

export const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined
