import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { productSitemapCount, productSitemapEntries } from "@/lib/seo/product-sitemaps";
import { publicSiteUrl } from "@/lib/site-url";

/** `/product/sitemap/[id].xml`: кожен файл — одна сторінка каталогу CRM, а не весь склад. */
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
    const entries = await productSitemapEntries(id + 1);
    return entries.map((entry) => {
      const lastModified = new Date(entry.updatedAt);
      return {
        url: new URL(`/product/${encodeURIComponent(entry.id)}`, base).toString(),
        lastModified: Number.isNaN(lastModified.getTime()) ? undefined : lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      };
    });
  } catch {
    return [];
  }
}
