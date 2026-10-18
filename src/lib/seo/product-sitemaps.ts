import "server-only";

import { catalogQuery, getCatalogPage, getSitemapSkuPageCount, SITEMAP_PAGE_SIZE } from "@/lib/crm/catalog";

/**
 * Кількість товарних sitemap-файлів: один файл — одна сторінка моделей CRM.
 * Кількість моделей бере з того самого запису кешу, що й перша сторінка /catalog.
 */
export async function productSitemapCount(): Promise<number> {
  try {
    const { modelCount } = await getCatalogPage(catalogQuery());
    return Math.max(1, Math.ceil(modelCount / SITEMAP_PAGE_SIZE));
  } catch {
    return 1;
  }
}

/** Кількість SKU-файлів у sitemap індексі; за збою залишаємо один порожній файл. */
export async function skuSitemapCount(): Promise<number> {
  try {
    return await getSitemapSkuPageCount();
  } catch {
    return 1;
  }
}
