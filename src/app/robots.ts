import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // `/order/` — приватний статус замовлення покупця; `/cart` і `/favorites`
      // залежать від localStorage, тож для робота завжди порожні.
      disallow: ["/api/", "/checkout", "/order/", "/cart", "/favorites"],
    },
    // Індекс: сам перелічує мапу сторінок і всі товарні файли.
    sitemap: new URL("/sitemap.xml", publicSiteUrl()).toString(),
  };
}
