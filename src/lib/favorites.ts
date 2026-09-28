"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storageWithLegacyArray } from "@/lib/persisted";

export const FAVORITES_STORAGE_KEY = "italino-favorites-v2";
const LEGACY_FAVORITES_STORAGE_KEY = "italino-favorites-v1";
const FAVORITES_VERSION = 3;

type FavoritesStore = {
  items: string[];
  /** false, доки не прочитано localStorage: перший рендер має збігтися з SSR. */
  hydrated: boolean;
  toggle: (productId: string) => void;
  reconcile: (productIds: string[]) => void;
  markHydrated: () => void;
};

function validFavorites(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.flatMap((item) => {
    if (typeof item === "string" && item) return [item];
    if (item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string") {
      return [(item as { id: string }).id];
    }
    return [];
  }))].slice(0, 500);
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      toggle: (productId) => set((state) => ({
        items: state.items.includes(productId)
          ? state.items.filter((item) => item !== productId)
          : [productId, ...state.items],
      })),
      reconcile: (productIds) => set((state) => {
        const items = validFavorites(productIds);
        return items.length === state.items.length && items.every((id, index) => id === state.items[index])
          ? state
          : { items };
      }),
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
  return useFavoritesStore((state) => state.items.includes(productId));
}

/** Кількість улюблених моделей для реактивних індикаторів інтерфейсу. */
export function useFavoritesCount(): number {
  return useFavoritesStore((state) => state.items.length);
}
