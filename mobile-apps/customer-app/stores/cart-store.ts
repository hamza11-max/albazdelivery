/**
 * Cart store - mirrors web app cart state
 */
import { create } from 'zustand';

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name?: string;
  image?: string;
}

interface CartStore {
  items: CartItem[];
  storeId: string | null;
  storeName: string | null;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }, storeId?: string, storeName?: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  storeId: null,
  storeName: null,
  addItem: (item, storeId, storeName) =>
    set((s) => {
      const existing = s.items.find((i) => i.productId === item.productId);
      const qty = item.quantity ?? 1;
      const newStoreId = storeId ?? s.storeId;
      const newStoreName = storeName ?? s.storeName;
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.productId === item.productId ? { ...i, quantity: i.quantity + qty } : i
          ),
          storeId: newStoreId,
          storeName: newStoreName,
        };
      }
      return {
        items: [...s.items, { ...item, quantity: qty }],
        storeId: newStoreId,
        storeName: newStoreName,
      };
    }),
  updateQuantity: (productId, delta) =>
    set((s) => ({
      items: s.items
        .map((i) =>
          i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
        )
        .filter((i) => i.quantity > 0),
    })),
  removeItem: (productId) =>
    set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
  clearCart: () => set({ items: [], storeId: null, storeName: null }),
  getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
