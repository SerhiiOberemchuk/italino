"use server";

import { FAVORITES_PAGE_SIZE } from "@/lib/favorites-page";
import type { ProductCard } from "@/lib/catalog/product-cards";
import { getModelCards } from "@/lib/crm/catalog";

/** Картки однієї сторінки обраного — один запит моделей за ключами. */
export async function resolveFavoriteProducts(rawIds: string[]): Promise<ProductCard[]> {
  if (!Array.isArray(rawIds)) return [];
  // Ключ моделі — код постачальника або id товару; трапляються й крапки («0048715.»).
  const ids = [...new Set(rawIds.filter(
    (id) => typeof id === "string" && /^[a-z0-9._-]{1,180}$/i.test(id),
  ))].slice(0, FAVORITES_PAGE_SIZE);
  if (!ids.length) return [];

  return getModelCards(ids);
}
