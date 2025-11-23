import { renderHook, act, cleanup } from '@testing-library/react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Mock storage utility
const mockStorage = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}

jest.mock('@/lib/utils', () => ({
  storage: {
    get: mockStorage.getItem,
    set: mockStorage.setItem,
    remove: mockStorage.removeItem,
  },
  cn: jest.fn(),
  formatDate: jest.fn(),
  formatDateTime: jest.fn(),
  isValidEmail: jest.fn(),
  isValidPhone: jest.fn(),
}))

// Import after mocking
import type { CartItem, Product } from '@/types/product'

// Create a test version of the cart store
const createTestCartStore = () => {
  return create<{
    items: CartItem[]
    addItem: (
      product: any,
      quantity?: number,
      variantId?: string,
      variantName?: string
    ) => void
    removeItem: (productId: string, variantId?: string) => void
    updateQuantity: (
      productId: string,
      quantity: number,
      variantId?: string
    ) => void
    clearCart: () => void
    getItemCount: () => number
    getTotal: () => number
  }>()(
    persist(
      (set, get) => ({
        items: [],

        addItem: (product, quantity = 1, variantId, variantName) => {
          set(state => {
            const existingItem = state.items.find(
              item =>
                item.productId === product.id && item.variantId === variantId
            )

            if (existingItem) {
              return {
                items: state.items.map(item =>
                  item.productId === product.id && item.variantId === variantId
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
                ),
              }
            } else {
              const newItem: CartItem = {
                productId: product.id,
                variantId,
                variantName,
                quantity,
                priceSnapshot: product.price,
                title: product.title,
                image: product.image,
                stock: product.stock,
              }
              return {
                items: [...state.items, newItem],
              }
            }
          })
        },

        removeItem: (productId, variantId) => {
          set(state => ({
            items: state.items.filter(
              item =>
                !(item.productId === productId && item.variantId === variantId)
            ),
          }))
        },

        updateQuantity: (productId, quantity, variantId) => {
          if (quantity <= 0) {
            get().removeItem(productId, variantId)
            return
          }

          set(state => ({
            items: state.items.map(item =>
              item.productId === productId && item.variantId === variantId
                ? { ...item, quantity }
                : item
            ),
          }))
        },

        clearCart: () => {
          set({ items: [] })
        },

        getItemCount: () => {
          return get().items.reduce((total, item) => total + item.quantity, 0)
        },

        getTotal: () => {
          return get().items.reduce(
            (total, item) => total + item.priceSnapshot * item.quantity,
            0
          )
        },
      }),
      {
        name: 'test-cart',
        storage: createJSONStorage(() => ({
          getItem: mockStorage.getItem,
          setItem: mockStorage.setItem,
          removeItem: mockStorage.removeItem,
        })),
      }
    )
  )
}

describe('Cart Store', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  const mockProduct: Product = {
    id: '1',
    title: 'Test Product',
    slug: 'test-product',
    price: 100,
    rating: 4.5,
    image: '/test.jpg',
    stock: 10,
  }

  describe('addItem', () => {
    it('should add a new item to cart', () => {
      const useTestCart = createTestCartStore()
      const { result } = renderHook(() => useTestCart())

      act(() => {
        result.current.addItem(mockProduct)
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0]).toEqual({
        productId: '1',
        quantity: 1,
        priceSnapshot: 100,
        title: 'Test Product',
        image: '/test.jpg',
        stock: 10,
      })
    })

    it('should increase quantity for existing item', () => {
      const useTestCart = createTestCartStore()
      const { result } = renderHook(() => useTestCart())

      act(() => {
        result.current.addItem(mockProduct)
        result.current.addItem(mockProduct)
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].quantity).toBe(2)
    })

    it('should add multiple items with custom quantity', () => {
      const useTestCart = createTestCartStore()
      const { result } = renderHook(() => useTestCart())

      act(() => {
        result.current.addItem(mockProduct, 3)
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].quantity).toBe(3)
    })
  })

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      const useTestCart = createTestCartStore()
      const { result } = renderHook(() => useTestCart())

      act(() => {
        result.current.addItem(mockProduct)
        result.current.removeItem('1')
      })

      expect(result.current.items).toHaveLength(0)
    })
  })

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const useTestCart = createTestCartStore()
      const { result } = renderHook(() => useTestCart())

      act(() => {
        result.current.addItem(mockProduct)
        result.current.updateQuantity('1', 5)
      })

      expect(result.current.items[0].quantity).toBe(5)
    })

    it('should remove item when quantity is 0', () => {
      const useTestCart = createTestCartStore()
      const { result } = renderHook(() => useTestCart())

      act(() => {
        result.current.addItem(mockProduct)
        result.current.updateQuantity('1', 0)
      })

      expect(result.current.items).toHaveLength(0)
    })
  })

  describe('clearCart', () => {
    it('should clear all items', () => {
      const useTestCart = createTestCartStore()
      const { result } = renderHook(() => useTestCart())

      act(() => {
        result.current.addItem(mockProduct)
        result.current.clearCart()
      })

      expect(result.current.items).toHaveLength(0)
    })
  })

  describe('getTotal', () => {
    it('should calculate total correctly', () => {
      const useTestCart = createTestCartStore()
      const { result } = renderHook(() => useTestCart())

      act(() => {
        result.current.addItem(mockProduct, 2)
      })

      expect(result.current.getTotal()).toBe(200) // 100 * 2
    })

    it('should return 0 for empty cart', () => {
      const useTestCart = createTestCartStore()
      const { result } = renderHook(() => useTestCart())

      expect(result.current.getTotal()).toBe(0)
    })
  })

  describe('getItemCount', () => {
    it('should count total items correctly', () => {
      const useTestCart = createTestCartStore()
      const { result } = renderHook(() => useTestCart())

      act(() => {
        result.current.addItem(mockProduct, 3)
      })

      expect(result.current.getItemCount()).toBe(3)
    })

    it('should return 0 for empty cart', () => {
      const useTestCart = createTestCartStore()
      const { result } = renderHook(() => useTestCart())

      expect(result.current.getItemCount()).toBe(0)
    })
  })

  describe('Variant Support', () => {
    it('should treat same product with different variants as separate items', () => {
      const useTestCart = createTestCartStore()
      const { result } = renderHook(() => useTestCart())

      act(() => {
        result.current.addItem(mockProduct, 1, 'variant-1', '1 Month')
        result.current.addItem(mockProduct, 1, 'variant-2', '6 Months')
      })

      expect(result.current.items).toHaveLength(2)
      expect(result.current.items[0]).toEqual({
        productId: '1',
        variantId: 'variant-1',
        variantName: '1 Month',
        quantity: 1,
        priceSnapshot: 100,
        title: 'Test Product',
        image: '/test.jpg',
        stock: 10,
      })
      expect(result.current.items[1]).toEqual({
        productId: '1',
        variantId: 'variant-2',
        variantName: '6 Months',
        quantity: 1,
        priceSnapshot: 100,
        title: 'Test Product',
        image: '/test.jpg',
        stock: 10,
      })
    })

    it('should update quantity for specific variant', () => {
      const useTestCart = createTestCartStore()
      const { result } = renderHook(() => useTestCart())

      act(() => {
        result.current.addItem(mockProduct, 1, 'variant-1', '1 Month')
        result.current.addItem(mockProduct, 2, 'variant-2', '6 Months')
        result.current.updateQuantity('1', 5, 'variant-1')
      })

      expect(result.current.items).toHaveLength(2)
      expect(result.current.items[0].quantity).toBe(5) // variant-1 updated
      expect(result.current.items[1].quantity).toBe(2) // variant-2 unchanged
    })

    it('should maintain backward compatibility for non-variant products', () => {
      const useTestCart = createTestCartStore()
      const { result } = renderHook(() => useTestCart())

      act(() => {
        result.current.addItem(mockProduct) // No variant parameters
        result.current.addItem(mockProduct, 2) // Should increase quantity
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0]).toEqual({
        productId: '1',
        variantId: undefined,
        variantName: undefined,
        quantity: 3,
        priceSnapshot: 100,
        title: 'Test Product',
        image: '/test.jpg',
        stock: 10,
      })
    })

    it('should remove specific variant item', () => {
      const useTestCart = createTestCartStore()
      const { result } = renderHook(() => useTestCart())

      act(() => {
        result.current.addItem(mockProduct, 1, 'variant-1', '1 Month')
        result.current.addItem(mockProduct, 1, 'variant-2', '6 Months')
        result.current.removeItem('1', 'variant-1')
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].variantId).toBe('variant-2')
    })
  })
})
