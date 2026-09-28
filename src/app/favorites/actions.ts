"use server";

import type { ProductCard } from "@/lib/catalog/product-cards";
import { getStoreCatalog } from "@/lib/crm/catalog";

export async function resolveFavoriteProducts(rawIds: string[]): Promise<ProductCard[]> {
  if (!Array.isArray(rawIds) || rawIds.length > 500) return [];
  const ids = [...new Set(rawIds.filter(
    (id) => typeof id === "string" && /^[a-z0-9_-]{1,180}$/i.test(id),
  ))];
  if (!ids.length) return [];

  const catalog = await getStoreCatalog();
  const byId = new Map(catalog.models.map((model) => [model.id, model]));
  return ids.flatMap((id) => {
    const product = byId.get(id);
    return product ? [product] : [];
  });
}
