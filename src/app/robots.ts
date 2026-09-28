import type { MetadataRoute } from "next";
import { productSitemapCount } from "@/lib/seo/product-sitemaps";
import { publicSiteUrl } from "@/lib/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = publicSiteUrl();
  const productSitemaps = Array.from(
    { length: await productSitemapCount() },
    (_, id) => new URL(`/product/sitemap/${id}.xml`, base).toString(),
  );
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // `/order/` — приватний статус замовлення покупця; `/cart` і `/favorites`
      // залежать від localStorage, тож для робота завжди порожні.
      disallow: ["/api/", "/checkout", "/order/", "/cart", "/favorites"],
    },
    sitemap: [new URL("/sitemap.xml", base).toString(), ...productSitemaps],
  };
}
