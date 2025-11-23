'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem } from '@/types/product'
import { storage } from '@/lib/utils'

interface CartState {
  items: CartItem[]
}

interface CartActions {
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
}

type CartStore = CartState & CartActions

export const useCart = create<CartStore>()(
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
            // Update existing item quantity
            return {
              items: state.items.map(item =>
                item.productId === product.id && item.variantId === variantId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            }
          } else {
            // Add new item
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
      name: 'ai4chill-cart-v1',
      storage: createJSONStorage(() => ({
        getItem: name => storage.get(name),
        setItem: (name, value) => storage.set(name, value),
        removeItem: name => storage.remove(name),
      })),
    }
  )
)
