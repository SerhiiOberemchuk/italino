import type { MetadataRoute } from "next";
import { getStoreProducts } from "@/lib/crm/catalog";
import { publicSiteUrl } from "@/lib/store";

/** Ті самі ключі, що приймає `/catalog/[category]`. */
const CATEGORIES = ["bags", "drinkware", "clothing", "hats", "office", "tech", "home", "travel"];

const STATIC_PATHS = [
  "/", "/catalog", "/delivery", "/returns", "/contacts",
  "/legal/offer", "/legal/privacy", "/legal/payment",
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

  for (const category of CATEGORIES) {
    entries.push({ url: url(`/catalog/${category}`), changeFrequency: "weekly", priority: 0.8 });
  }

  // Товари — з кешованого каталогу; недоступність CRM не має ламати збірку.
  try {
    const models = new Map<string, string>();
    for (const product of await getStoreProducts()) {
      const key = product.productGroupId ?? product.id;
      if (!models.has(key)) models.set(key, product.updatedAt);
    }
    for (const [key, updatedAt] of models) {
      const lastModified = new Date(updatedAt);
      entries.push({
        url: url(`/product/${encodeURIComponent(key)}`),
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
