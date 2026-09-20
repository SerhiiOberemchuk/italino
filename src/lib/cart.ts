"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { validCartItems, type CartItem } from "@/lib/cart-item";
import { storageWithLegacyArray } from "@/lib/persisted";

export const CART_STORAGE_KEY = "italino-cart-v2";
const LEGACY_CART_STORAGE_KEY = "italino-cart-v1";
const CART_VERSION = 2;

export type { CartItem };

type CartStore = {
  items: CartItem[];
  /** false, доки не прочитано localStorage: перший рендер має збігтися з SSR. */
  hydrated: boolean;
  addItem: (item: CartItem) => void;
  setItems: (items: CartItem[]) => void;
  setQuantity: (sku: string, quantity: number) => void;
  clear: () => void;
  markHydrated: () => void;
};

function limit(item: CartItem): number {
  return Math.max(0, Math.min(item.maxQuantity ?? 99, 99));
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      addItem: (item) => set((state) => {
        const existing = state.items.find((line) => line.sku === item.sku);
        if (!existing) return { items: [{ ...item, quantity: Math.min(limit(item), item.quantity) }, ...state.items] };
        return {
          items: state.items.map((line) => line.sku === item.sku
            ? { ...line, ...item, quantity: Math.min(limit(item), line.quantity + item.quantity) }
            : line),
        };
      }),
      setItems: (items) => set({ items: validCartItems(items) }),
      setQuantity: (sku, quantity) => set((state) => ({
        items: state.items.flatMap((item) => item.sku === sku
          ? quantity > 0 ? [{ ...item, quantity: Math.min(limit(item), quantity) }] : []
          : [item]),
      })),
      clear: () => set({ items: [] }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: CART_STORAGE_KEY,
      version: CART_VERSION,
      storage: storageWithLegacyArray(LEGACY_CART_STORAGE_KEY, CART_VERSION, validCartItems),
      // Читання localStorage починає <StoreHydrator> після гідрації React.
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      migrate: (persisted) => ({ items: validCartItems((persisted as { items?: unknown } | null)?.items) }),
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    },
  ),
);

/** Кількість одиниць у кошику; до регідрації — 0. */
export function useCartCount(): number {
  return useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
}

/** Чи артикул уже в кошику. Селектор повертає булеан — зайвих ре-рендерів немає. */
export function useSkuInCart(sku: string): boolean {
  return useCartStore((state) => state.items.some((item) => item.sku === sku));
}
