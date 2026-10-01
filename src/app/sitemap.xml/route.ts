import { connection } from "next/server";
import { productSitemapCount } from "@/lib/seo/product-sitemaps";
import { sitemapIndexResponse } from "@/lib/seo/sitemap-xml";
import { publicSiteUrl } from "@/lib/site-url";

/**
 * Індекс мап сайту: сторінки й категорії плюс товарні файли по 100 моделей.
 * Пошуковик, якому подали лише `/sitemap.xml`, через індекс бачить і товари.
 * Кількість файлів — та сама, що в `generateSitemaps` товарної мапи.
 */
export async function GET(): Promise<Response> {
  await connection();
  const base = publicSiteUrl();
  const productSitemaps = Array.from(
    { length: await productSitemapCount() },
    (_, id) => new URL(`/product/sitemap/${id}.xml`, base).toString(),
  );
  return sitemapIndexResponse([new URL("/sitemap-pages.xml", base).toString(), ...productSitemaps]);
}
