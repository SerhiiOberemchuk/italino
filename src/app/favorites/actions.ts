"use server";

import { FAVORITES_PAGE_SIZE } from "@/lib/favorites-page";
import { toProductCards, type ProductCard } from "@/lib/catalog/product-cards";
import { getProductVariants } from "@/lib/crm/catalog";

/**
 * Картки однієї сторінки обраного. Кожна модель — точковий запит її варіантів
 * (той самий кеш, що й сторінка товару); більше сторінки за раз не читаємо.
 */
export async function resolveFavoriteProducts(rawIds: string[]): Promise<ProductCard[]> {
  if (!Array.isArray(rawIds)) return [];
  const ids = [...new Set(rawIds.filter(
    (id) => typeof id === "string" && /^[a-z0-9_-]{1,180}$/i.test(id),
  ))].slice(0, FAVORITES_PAGE_SIZE);
  if (!ids.length) return [];

  const variants = await Promise.all(ids.map((id) => getProductVariants(id)));
  return variants.flatMap((rows, index) => {
    const card = toProductCards(rows)[0];
    return card ? [{ ...card, id: ids[index] }] : [];
  });
}
