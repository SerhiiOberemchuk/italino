import type { MetadataRoute } from "next";
import { getStoreCategories } from "@/lib/crm/catalog";
import { categoryKey } from "@/lib/catalog/categories";
import { publicSiteUrl } from "@/lib/site-url";

const STATIC_PATHS = [
  "/", "/catalog", "/delivery", "/returns", "/contacts",
  "/legal/offer", "/legal/terms", "/legal/privacy", "/legal/payment",
];

/** Статичні сторінки й категорії. Товари — окремо, по сторінці CRM: `/product/sitemap/[id].xml`. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicSiteUrl();
  const url = (path: string) => new URL(path, base).toString();

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
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

  return entries;
}
