import { connection } from "next/server";
import { productSitemapCount, skuSitemapCount } from "@/lib/seo/product-sitemaps";
import { sitemapIndexResponse } from "@/lib/seo/sitemap-xml";
import { publicSiteUrl } from "@/lib/site-url";

/**
 * Індекс мап сайту: сторінки й категорії, моделі та окремі SKU.
 * Пошуковик, якому подали лише `/sitemap.xml`, через індекс бачить і товари.
 * Кількість файлів — та сама, що в `generateSitemaps` товарної мапи.
 */
export async function GET(): Promise<Response> {
  await connection();
  const base = publicSiteUrl();
  const [modelCount, skuCount] = await Promise.all([productSitemapCount(), skuSitemapCount()]);
  const productSitemaps = Array.from(
    { length: modelCount },
    (_, id) => new URL(`/product/sitemap/${id}.xml`, base).toString(),
  );
  const skuSitemaps = Array.from(
    { length: skuCount },
    (_, id) => new URL(`/product/sku/sitemap/${id}.xml`, base).toString(),
  );
  return sitemapIndexResponse([
    new URL("/sitemap-pages.xml", base).toString(),
    ...productSitemaps,
    ...skuSitemaps,
  ]);
}
