import "server-only";

import type { MetadataRoute } from "next";

/**
 * XML мап сайту для route handlers. Next серіалізує лише `sitemap.ts` у власній
 * теці, а `<sitemapindex>` і мапу з довільним кореневим ім'ям не вміє.
 */

const SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";

const XML_ENTITIES: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;",
};

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => XML_ENTITIES[char]);
}

function xmlResponse(body: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${body}\n`, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Як у `sitemap.ts` Next: CDN щоразу перевіряє свіжість.
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}

export type SitemapUrl = Pick<MetadataRoute.Sitemap[number], "url" | "changeFrequency" | "priority">;

export function urlsetResponse(entries: readonly SitemapUrl[]): Response {
  const urls = entries.map((entry) => [
    "<url>",
    `<loc>${escapeXml(entry.url)}</loc>`,
    entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : "",
    entry.priority === undefined ? "" : `<priority>${entry.priority}</priority>`,
    "</url>",
  ].filter(Boolean).join("\n"));
  return xmlResponse(`<urlset xmlns="${SITEMAP_NS}">\n${urls.join("\n")}\n</urlset>`);
}

export function sitemapIndexResponse(locations: readonly string[]): Response {
  const sitemaps = locations.map((loc) => `<sitemap>\n<loc>${escapeXml(loc)}</loc>\n</sitemap>`);
  return xmlResponse(`<sitemapindex xmlns="${SITEMAP_NS}">\n${sitemaps.join("\n")}\n</sitemapindex>`);
}
