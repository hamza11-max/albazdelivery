'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'

export interface StorefrontCartItem {
  productId: string
  storeId: string
  name: string
  price: number
  image?: string | null
  quantity: number
}

interface CartState {
  items: StorefrontCartItem[]
}

type CartAction =
  | { type: 'hydrate'; items: StorefrontCartItem[] }
  | { type: 'add'; item: StorefrontCartItem }
  | { type: 'remove'; productId: string }
  | { type: 'setQty'; productId: string; quantity: number }
  | { type: 'clear' }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'hydrate':
      return { items: action.items }
    case 'add': {
      const existing = state.items.find(
        (i) => i.productId === action.item.productId
      )
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === action.item.productId
              ? { ...i, quantity: i.quantity + action.item.quantity }
              : i
          ),
        }
      }
      return { items: [...state.items, action.item] }
    }
    case 'remove':
      return {
        items: state.items.filter((i) => i.productId !== action.productId),
      }
    case 'setQty':
      return {
        items: state.items
          .map((i) =>
            i.productId === action.productId
              ? { ...i, quantity: Math.max(0, action.quantity) }
              : i
          )
          .filter((i) => i.quantity > 0),
      }
    case 'clear':
      return { items: [] }
    default:
      return state
  }
}

interface StorefrontCartContextValue extends CartState {
  vendorId: string
  vendorSlug: string
  totalItems: number
  subtotal: number
  addItem: (item: StorefrontCartItem) => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  clear: () => void
}

const StorefrontCartContext =
  createContext<StorefrontCartContextValue | null>(null)

const STORAGE_KEY_PREFIX = 'albaz.storefront.cart.v1:'

export function StorefrontCartProvider({
  vendorId,
  vendorSlug,
  children,
}: {
  vendorId: string
  vendorSlug: string
  children: React.ReactNode
}) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })
  const storageKey = `${STORAGE_KEY_PREFIX}${vendorId}`

  // Hydrate from localStorage (per-vendor cart)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed?.items)) {
        dispatch({ type: 'hydrate', items: parsed.items })
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, [storageKey])

  // Persist on change
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ items: state.items })
      )
    } catch {
      /* ignore storage errors (quota, privacy mode) */
    }
  }, [state.items, storageKey])

  const addItem = useCallback(
    (item: StorefrontCartItem) => dispatch({ type: 'add', item }),
    []
  )
  const removeItem = useCallback(
    (productId: string) => dispatch({ type: 'remove', productId }),
    []
  )
  const setQuantity = useCallback(
    (productId: string, quantity: number) =>
      dispatch({ type: 'setQty', productId, quantity }),
    []
  )
  const clear = useCallback(() => dispatch({ type: 'clear' }), [])

  const value = useMemo<StorefrontCartContextValue>(() => {
    const totalItems = state.items.reduce((acc, i) => acc + i.quantity, 0)
    const subtotal = state.items.reduce(
      (acc, i) => acc + i.price * i.quantity,
      0
    )
    return {
      items: state.items,
      vendorId,
      vendorSlug,
      totalItems,
      subtotal,
      addItem,
      removeItem,
      setQuantity,
      clear,
    }
  }, [state.items, vendorId, vendorSlug, addItem, removeItem, setQuantity, clear])

  return (
    <StorefrontCartContext.Provider value={value}>
      {children}
    </StorefrontCartContext.Provider>
  )
}

export function useStorefrontCart(): StorefrontCartContextValue {
  const ctx = useContext(StorefrontCartContext)
  if (!ctx) {
    throw new Error(
      'useStorefrontCart must be used inside a StorefrontCartProvider'
    )
  }
  return ctx
}
