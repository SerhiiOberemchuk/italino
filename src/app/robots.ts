import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/store";

export default function robots(): MetadataRoute.Robots {
  const base = publicSiteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/checkout"] },
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
