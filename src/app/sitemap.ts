import type { MetadataRoute } from "next";
import { getStoreCatalog, getStoreCategories } from "@/lib/crm/catalog";
import { categoryKey, usedCategoriesByIds } from "@/lib/catalog/categories";
import { publicSiteUrl } from "@/lib/site-url";

const STATIC_PATHS = [
  "/", "/catalog", "/delivery", "/returns", "/contacts",
  "/legal/offer", "/legal/terms", "/legal/privacy", "/legal/payment",
];

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
    const [categories, catalog] = await Promise.all([getStoreCategories(), getStoreCatalog()]);
    for (const category of usedCategoriesByIds(
      categories,
      catalog.models.flatMap((model) => model.categoryIds),
    )) {
      entries.push({
        url: url(`/catalog/${encodeURIComponent(categoryKey(category))}`),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const model of catalog.models) {
      const lastModified = new Date(model.updatedAt);
      entries.push({
        url: url(`/product/${encodeURIComponent(model.id)}`),
        lastModified: Number.isNaN(lastModified.getTime()) ? undefined : lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // Без CRM віддаємо лише статичну частину мапи.
  }

  return entries;
}
