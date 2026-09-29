import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getSitemapModels } from "@/lib/crm/catalog";
import { productSitemapCount } from "@/lib/seo/product-sitemaps";
import { publicSiteUrl } from "@/lib/site-url";

/** `/product/sitemap/[id].xml`: кожен файл — одна сторінка моделей CRM (100), а не весь склад. */
export async function generateSitemaps() {
  const count = await productSitemapCount();
  return Array.from({ length: count }, (_, id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  // Файли будуються на запит робота, а не всі разом під час збірки.
  await connection();
  const id = Number(await props.id);
  if (!Number.isInteger(id) || id < 0) return [];

  const base = publicSiteUrl();
  try {
    const models = await getSitemapModels(id + 1);
    return models.map((model) => {
      const lastModified = new Date(model.updatedAt);
      return {
        url: new URL(`/product/${encodeURIComponent(model.key)}`, base).toString(),
        lastModified: Number.isNaN(lastModified.getTime()) ? undefined : lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      };
    });
  } catch {
    return [];
  }
}
