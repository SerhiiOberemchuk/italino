import type { Route } from "next";
import type { CrmModel } from "@/lib/crm/types";

/**
 * View-модель картки товару на вітрині.
 * Каталог CRM плоский (один рядок = один артикул «колір × розмір», як у Sipec),
 * але `GET /models` уже згортає рядки однієї моделі (спільний `productGroupId`)
 * в одну картку: ціна, фото й SKU — найдешевшого варіанта, плюс кольори й розміри.
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

/** Картка сторінки каталогу: ще й категорії (плитки головної) та `updatedAt` (sitemap). */
export type CatalogCard = ProductCard & {
  categoryIds: string[];
  updatedAt: string;
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

function discountPercent(price: number | null, compareAtPrice: number | null): number | null {
  return price !== null && compareAtPrice !== null && compareAtPrice > price
    ? Math.round((1 - price / compareAtPrice) * 100)
    : null;
}

function productHref(key: string, sku: string | null): Route {
  return (sku
    ? `/product/${encodeURIComponent(key)}?sku=${encodeURIComponent(sku)}`
    : `/product/${encodeURIComponent(key)}`) as Route;
}

/**
 * Картка моделі. Для Sale (`onSale`) ціна, фото й посилання беруться з
 * найдешевшого акційного варіанта, а не з найдешевшого взагалі.
 */
export function modelCard(model: CrmModel, onSale = false): CatalogCard {
  const sale = onSale ? model.sale : null;
  const price = sale ? sale.price : model.price;
  const compareAtPrice = sale ? sale.compareAtPrice : model.compareAtPrice;
  const percent = discountPercent(price, compareAtPrice);

  return {
    id: model.key,
    href: productHref(model.key, sale ? sale.sku : model.sku),
    name: model.name,
    brand: model.brand?.name?.trim() || null,
    image: (sale?.image ?? model.image)?.url ?? null,
    imageAlt: model.name,
    price,
    compareAtPrice,
    currency: model.currency,
    colors: model.colors,
    sizes: sortSizes(model.sizes),
    badge: percent ? "sale" : model.tags.includes("new") ? "new" : null,
    discountPercent: percent,
    categoryIds: model.category?.id ? [model.category.id] : [],
    updatedAt: model.updatedAt,
  };
}
