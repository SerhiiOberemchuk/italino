import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/store";

export default function robots(): MetadataRoute.Robots {
  const base = publicSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // `/order/` — приватний статус замовлення покупця; `/cart` і `/favorites`
      // залежать від localStorage, тож для робота завжди порожні.
      disallow: ["/api/", "/checkout", "/order/", "/cart", "/favorites"],
    },
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
