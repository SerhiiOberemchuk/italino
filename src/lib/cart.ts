"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const CART_STORAGE_KEY = "italino-cart-v2";
const LEGACY_CART_STORAGE_KEY = "italino-cart-v1";

export type CartItem = {
  productId: string;
  sku: string;
  name: string;
  image: string | null;
  price: number;
  currency: string;
  color: string | null;
  size: string | null;
  quantity: number;
  href?: string;
  maxQuantity?: number | null;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  setItems: (items: CartItem[]) => void;
  setQuantity: (sku: string, quantity: number) => void;
  clear: () => void;
};

function limit(item: CartItem): number {
  return Math.max(0, Math.min(item.maxQuantity ?? 99, 99));
}

function validItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is CartItem => {
    const candidate = item as Partial<CartItem>;
    return typeof candidate.sku === "string" && typeof candidate.quantity === "number";
  });
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existing = state.items.find((line) => line.sku === item.sku);
        if (!existing) return { items: [{ ...item, quantity: Math.min(limit(item), item.quantity) }, ...state.items] };
        return {
          items: state.items.map((line) => line.sku === item.sku
            ? { ...line, ...item, quantity: Math.min(limit(item), line.quantity + item.quantity) }
            : line),
        };
      }),
      setItems: (items) => set({ items: validItems(items) }),
      setQuantity: (sku, quantity) => set((state) => ({
        items: state.items.flatMap((item) => item.sku === sku
          ? quantity > 0 ? [{ ...item, quantity: Math.min(limit(item), quantity) }] : []
          : [item]),
      })),
      clear: () => set({ items: [] }),
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (!state || state.items.length || typeof window === "undefined") return;
        try {
          const legacy = validItems(JSON.parse(localStorage.getItem(LEGACY_CART_STORAGE_KEY) ?? "[]"));
          if (legacy.length) {
            state.setItems(legacy);
            localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
          }
        } catch {
          // Invalid legacy data is ignored; the persisted store remains usable.
        }
      },
    },
  ),
);
