import { connection } from "next/server";
import { getStoreCategories } from "@/lib/crm/catalog";
import { categoryKey } from "@/lib/catalog/categories";
import { urlsetResponse, type SitemapUrl } from "@/lib/seo/sitemap-xml";
import { publicSiteUrl } from "@/lib/site-url";

const STATIC_PATHS = [
  "/", "/catalog", "/delivery", "/returns", "/contacts",
  "/legal/offer", "/legal/terms", "/legal/privacy", "/legal/payment",
];

/**
 * Статичні сторінки й категорії. Лежить у корені сайту: мапа може містити лише
 * адреси зі своєї теки й нижче. Товари — `/product/sitemap/[id].xml`, усе разом
 * зводить індекс `/sitemap.xml`.
 */
export async function GET(): Promise<Response> {
  // Категорії — на запит робота з кешу CRM, а не знімок часу збірки.
  await connection();
  const base = publicSiteUrl();
  const url = (path: string) => new URL(path, base).toString();

  const entries: SitemapUrl[] = STATIC_PATHS.map((path) => ({
    url: url(path),
    changeFrequency: path.startsWith("/legal/") || path === "/contacts" || path === "/returns"
      ? "yearly"
      : "weekly",
    priority: path === "/" ? 1 : path === "/catalog" ? 0.9 : 0.5,
  }));

  try {
    for (const category of await getStoreCategories()) {
      entries.push({
        url: url(`/catalog/${encodeURIComponent(categoryKey(category))}`),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // Без CRM віддаємо лише статичну частину мапи.
  }

  return urlsetResponse(entries);
}
