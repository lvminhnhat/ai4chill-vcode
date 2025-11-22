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
import type { CartItem } from '@/types/product'

// Create a test version of the cart store
const createTestCartStore = () => {
  return create<{
    items: CartItem[]
    addItem: (product: any, quantity?: number) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    getItemCount: () => number
    getTotal: () => number
  }>()(
    persist(
      (set, get) => ({
        items: [],

        addItem: (product, quantity = 1) => {
          set(state => {
            const existingItem = state.items.find(
              item => item.productId === product.id
            )

            if (existingItem) {
              return {
                items: state.items.map(item =>
                  item.productId === product.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
                ),
              }
            } else {
              const newItem: CartItem = {
                productId: product.id,
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

        removeItem: productId => {
          set(state => ({
            items: state.items.filter(item => item.productId !== productId),
          }))
        },

        updateQuantity: (productId, quantity) => {
          if (quantity <= 0) {
            get().removeItem(productId)
            return
          }

          set(state => ({
            items: state.items.map(item =>
              item.productId === productId ? { ...item, quantity } : item
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

  const mockProduct = {
    id: '1',
    title: 'Test Product',
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
})
