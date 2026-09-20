import type { ProductCard } from "@/lib/catalog/product-cards";

export const FAVORITES_STORAGE_KEY = "italino-favorites-v1";
export const FAVORITES_EVENT = "italino-favorites-change";

export type FavoriteProduct = ProductCard;

export function readFavorites(): FavoriteProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is FavoriteProduct => {
      const candidate = item as Partial<FavoriteProduct>;
      return typeof candidate.id === "string" && typeof candidate.href === "string" && typeof candidate.name === "string";
    });
  } catch {
    return [];
  }
}

export function writeFavorites(items: FavoriteProduct[]) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(FAVORITES_EVENT));
}

export function toggleFavorite(product: FavoriteProduct) {
  const items = readFavorites();
  const present = items.some((item) => item.id === product.id);
  writeFavorites(present ? items.filter((item) => item.id !== product.id) : [product, ...items]);
}
