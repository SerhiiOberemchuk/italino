import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { catalogQuery, getCatalogPage } from "@/lib/crm/catalog";

/**
 * Кількість товарних sitemap-файлів: один файл — одна сторінка каталогу CRM.
 * Той самий запис кешу, що й перша сторінка /catalog.
 */
export async function productSitemapCount(): Promise<number> {
  try {
    return (await getCatalogPage(catalogQuery())).pageCount;
  } catch {
    return 1;
  }
}

export type ProductSitemapEntry = { id: string; updatedAt: string };

/**
 * Моделі одного sitemap-файлу. Кешується на добу: робот, що обходить усі файли
 * поспіль, не має з'їдати ліміт CRM, потрібний покупцям.
 */
export async function productSitemapEntries(page: number): Promise<ProductSitemapEntry[]> {
  "use cache: remote";
  cacheLife("days");
  cacheTag("catalog", "products");
  const { cards } = await getCatalogPage(catalogQuery({ page }));
  return cards.map((card) => ({ id: card.id, updatedAt: card.updatedAt }));
}
