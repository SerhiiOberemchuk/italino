import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/store";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicSiteUrl();
  const paths = ["/", "/catalog", "/delivery", "/returns", "/contacts", "/legal/offer", "/legal/privacy", "/legal/payment"];
  return paths.map((path, index) => ({
    url: new URL(path, base).toString(),
    changeFrequency: path.startsWith("/legal/") || path === "/contacts" || path === "/returns" ? "yearly" : "weekly",
    priority: index === 0 ? 1 : path === "/catalog" ? 0.9 : 0.5,
  }));
}
