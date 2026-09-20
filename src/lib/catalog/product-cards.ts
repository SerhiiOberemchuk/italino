import type { Route } from "next";
import type { CrmProduct } from "@/lib/crm/types";

/**
 * View-модель картки товару на вітрині.
 * Каталог CRM плоский (один рядок = один артикул «колір × розмір», як у Sipec);
 * тут рядки однієї моделі (спільний `productGroupId`) згортаються в одну картку
 * з переліком кольорів і розмірів.
 */
export type ProductCard = {
  id: string;
  href: Route;
  name: string;
  brand: string | null;
  image: string | null;
  imageAlt: string;
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  colors: string[];
  sizes: string[];
  badge: "new" | "sale" | null;
  discountPercent: number | null;
};

const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];

function sizeRank(size: string): number {
  const upper = size.toUpperCase();
  const letterIndex = LETTER_SIZES.indexOf(upper);
  if (letterIndex >= 0) return 1000 + letterIndex;
  const numeric = Number.parseFloat(upper.replace(",", "."));
  return Number.isFinite(numeric) ? numeric : 2000;
}

/** Унікальні розміри у порядку носіння: числові за значенням, літерні за шкалою. */
export function sortSizes(sizes: Iterable<string>): string[] {
  return [...new Set(sizes)].sort(
    (a, b) => sizeRank(a) - sizeRank(b) || a.localeCompare(b, "uk"),
  );
}

export function toProductCards(products: CrmProduct[]): ProductCard[] {
  const groups = new Map<string, CrmProduct[]>();
  for (const product of products) {
    if (product.status !== "active") continue;
    const key = product.productGroupId ?? product.id;
    const rows = groups.get(key);
    if (rows) rows.push(product);
    else groups.set(key, [product]);
  }

  return [...groups.entries()].map(([key, rows]) => {
    let cheapest: CrmProduct = rows[0];
    for (const row of rows) {
      if (row.price === null) continue;
      if (cheapest.price === null || row.price < cheapest.price) cheapest = row;
    }
    const lead = rows.find((row) => row.images.length > 0) ?? rows[0];
    const price = cheapest.price;
    const compareAtPrice = cheapest.compareAtPrice;
    const discountPercent =
      price !== null && compareAtPrice !== null && compareAtPrice > price
        ? Math.round((1 - price / compareAtPrice) * 100)
        : null;
    const isNew = rows.some((row) => row.tags.includes("new"));

    return {
      id: key,
      href: `/product/${encodeURIComponent(key)}` as Route,
      name: lead.name,
      brand: lead.brand?.name ?? null,
      image: lead.images[0]?.url ?? null,
      imageAlt: lead.name,
      price,
      compareAtPrice,
      currency: cheapest.currency,
      colors: [...new Set(rows.flatMap((row) => (row.color ? [row.color] : [])))],
      sizes: sortSizes(rows.flatMap((row) => (row.size ? [row.size] : []))),
      badge: discountPercent ? "sale" : isNew ? "new" : null,
      discountPercent,
    };
  });
}
