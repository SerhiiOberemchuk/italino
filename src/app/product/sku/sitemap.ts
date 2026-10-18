import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getSitemapSkus } from "@/lib/crm/catalog";
import { skuSitemapCount } from "@/lib/seo/product-sitemaps";
import { publicSiteUrl } from "@/lib/site-url";

/** `/product/sku/sitemap/[id].xml`: канонічні сторінки активних артикулів CRM. */
export async function generateSitemaps() {
  const count = await skuSitemapCount();
  return Array.from({ length: count }, (_, id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  await connection();
  const id = Number(await props.id);
  if (!Number.isInteger(id) || id < 0) return [];

  const base = publicSiteUrl();
  try {
    const products = await getSitemapSkus(id + 1);
    return products.map((product) => {
      const lastModified = new Date(product.updatedAt);
      return {
        url: new URL(`/product/sku/${encodeURIComponent(product.sku)}`, base).toString(),
        lastModified: Number.isNaN(lastModified.getTime()) ? undefined : lastModified,
        changeFrequency: "weekly",
        priority: 0.6,
      };
    });
  } catch {
    return [];
  }
}
