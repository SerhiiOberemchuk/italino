"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductCard } from "@/lib/catalog/product-cards";
import { storageWithLegacyArray } from "@/lib/persisted";

export const FAVORITES_STORAGE_KEY = "italino-favorites-v2";
const LEGACY_FAVORITES_STORAGE_KEY = "italino-favorites-v1";
const FAVORITES_VERSION = 2;

/** У добірці зберігається вся картка — сторінка `/favorites` малює її без запиту в CRM. */
export type FavoriteProduct = ProductCard;

type FavoritesStore = {
  items: FavoriteProduct[];
  /** false, доки не прочитано localStorage: перший рендер має збігтися з SSR. */
  hydrated: boolean;
  toggle: (product: FavoriteProduct) => void;
  markHydrated: () => void;
};

function validFavorites(value: unknown): FavoriteProduct[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is FavoriteProduct => {
    const candidate = item as Partial<FavoriteProduct>;
    return typeof candidate.id === "string"
      && typeof candidate.href === "string"
      && typeof candidate.name === "string";
  });
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      toggle: (product) => set((state) => ({
        items: state.items.some((item) => item.id === product.id)
          ? state.items.filter((item) => item.id !== product.id)
          : [product, ...state.items],
      })),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: FAVORITES_STORAGE_KEY,
      version: FAVORITES_VERSION,
      storage: storageWithLegacyArray(LEGACY_FAVORITES_STORAGE_KEY, FAVORITES_VERSION, validFavorites),
      // Читання localStorage починає <StoreHydrator> після гідрації React.
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      migrate: (persisted) => ({ items: validFavorites((persisted as { items?: unknown } | null)?.items) }),
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    },
  ),
);

/**
 * Чи товар у добірці. Селектор повертає булеан, тож картка перемальовується
 * лише тоді, коли змінився стан саме її сердечка.
 */
export function useIsFavorite(productId: string): boolean {
  return useFavoritesStore((state) => state.items.some((item) => item.id === productId));
}
