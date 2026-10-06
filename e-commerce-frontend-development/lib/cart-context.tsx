'use client'

import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import type { CartItem, Product } from '@/lib/types'

type CartAction =
  | { type: 'add'; product: Product; quantity: number }
  | { type: 'setQuantity'; productId: number; quantity: number }
  | { type: 'remove'; productId: number }
  | { type: 'clear' }
  | { type: 'hydrate'; items: CartItem[] }

function clampQuantity(quantity: number, stock: number) {
  return Math.max(1, Math.min(Math.floor(quantity), Math.max(stock, 1)))
}

function cartReducer(items: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'add': {
      const existing = items.find((item) => item.product.product_id === action.product.product_id)
      if (existing) {
        return items.map((item) =>
          item === existing
            ? {
                product: action.product,
                quantity: clampQuantity(item.quantity + action.quantity, action.product.stock),
              }
            : item,
        )
      }
      return [
        ...items,
        { product: action.product, quantity: clampQuantity(action.quantity, action.product.stock) },
      ]
    }
    case 'setQuantity':
      return items.map((item) =>
        item.product.product_id === action.productId
          ? { ...item, quantity: clampQuantity(action.quantity, item.product.stock) }
          : item,
      )
    case 'remove':
      return items.filter((item) => item.product.product_id !== action.productId)
    case 'clear':
      return []
    case 'hydrate':
      return action.items
  }
}

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  hydrated: boolean
  addItem: (product: Product, quantity?: number) => void
  setQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'meridian-cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, [])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) dispatch({ type: 'hydrate', items: JSON.parse(saved) as CartItem[] })
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      hydrated,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.quantity * item.product.price, 0),
      addItem: (product, quantity = 1) => dispatch({ type: 'add', product, quantity }),
      setQuantity: (productId, quantity) => dispatch({ type: 'setQuantity', productId, quantity }),
      removeItem: (productId) => dispatch({ type: 'remove', productId }),
      clearCart: () => dispatch({ type: 'clear' }),
    }),
    [items, hydrated],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
