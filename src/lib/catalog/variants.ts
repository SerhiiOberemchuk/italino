import type { CrmProduct } from "@/lib/crm/types";
import { sortSizes } from "@/lib/catalog/product-cards";

/**
 * Варіанти моделі (головне правило пояснює `ProductCard`: CRM віддає плоский
 * каталог, один рядок = один артикул «колір × розмір»). Тут — чисті
 * функції для сторінки товару: які осі вибору показати, який рядок обрати,
 * яку галерею й ціну малювати. Жодного React — усе легко перевірити окремо.
 */

const UNAVAILABLE_STATUSES = ["out_of_stock", "discontinued"];

/** Той самий критерій «можна додати в кошик», що й у BuyBox. */
export function isPurchasable(product: CrmProduct): boolean {
  return Boolean(
    product.sku
    && product.price !== null
    && (product.stock === null || product.stock > 0)
    && !UNAVAILABLE_STATUSES.includes(product.availability),
  );
}

export type VariantAxes = {
  colors: { name: string; imageUrl: string | null; available: boolean }[];
  hasSizes: boolean;
};

/**
 * Осі вибору моделі: унікальні кольори (у порядку появи в CRM) і чи взагалі
 * є розмір. `available` кольору — чи є в ньому хоч один придатний до купівлі
 * артикул (решта показуються тьмяними, але не заблокованими — фото й розміри
 * все одно варто побачити).
 */
export function variantAxes(variants: readonly CrmProduct[]): VariantAxes {
  const colors: VariantAxes["colors"] = [];
  const seen = new Set<string>();

  for (const variant of variants) {
    const name = variant.color?.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);

    const sameColor = variants.filter((row) => row.color === variant.color);
    colors.push({
      name,
      imageUrl: variant.images[0]?.url ?? null,
      available: sameColor.some(isPurchasable),
    });
  }

  return { colors, hasSizes: variants.some((variant) => Boolean(variant.size)) };
}

/**
 * Розміри для обраного кольору, у порядку носіння (`sortSizes`).
 * `color: null` — колірної осі в моделі немає, беремо розміри з усіх рядків.
 * `sku` — артикул, який відповідає розміру (для не-придатних береться перший
 * знайдений — обрати його однаково не можна, а показати розмір потрібно).
 */
export function sizesForColor(
  variants: readonly CrmProduct[],
  color: string | null,
): { size: string; sku: string; available: boolean }[] {
  const bySize = new Map<string, CrmProduct[]>();

  for (const variant of variants) {
    if (!variant.size) continue;
    if (color !== null && variant.color !== color) continue;
    const rows = bySize.get(variant.size);
    if (rows) rows.push(variant);
    else bySize.set(variant.size, [variant]);
  }

  return sortSizes(bySize.keys()).map((size) => {
    const rows = bySize.get(size) as CrmProduct[];
    const purchasableRow = rows.find(isPurchasable);
    const chosen = purchasableRow ?? rows[0];
    return { size, sku: chosen.sku ?? "", available: Boolean(purchasableRow) };
  });
}

/**
 * Обирає артикул моделі за наміром покупця. Порядок правил:
 * 1. точний збіг `sku`;
 * 2. той самий колір + той самий розмір;
 * 3. перший ПРИДАТНИЙ до купівлі артикул того кольору;
 * 4. будь-який артикул того кольору;
 * 5. перший придатний артикул моделі;
 * 6. перший рядок узагалі.
 * Без колірної осі (`color` не передано або `null`) кроки 2–4 працюють на
 * всіх варіантах моделі — так само обирається розмір, коли кольору не існує.
 */
export function pickVariant(
  variants: readonly CrmProduct[],
  selection: { sku?: string | null; color?: string | null; size?: string | null },
): CrmProduct {
  if (selection.sku) {
    const bySku = variants.find((variant) => variant.sku === selection.sku);
    if (bySku) return bySku;
  }

  const hasColor = selection.color !== undefined && selection.color !== null;
  const scoped = hasColor ? variants.filter((variant) => variant.color === selection.color) : variants;

  if (selection.size) {
    const exact = scoped.find((variant) => variant.size === selection.size);
    if (exact) return exact;
  }

  if (hasColor) {
    const purchasableInColor = scoped.find(isPurchasable);
    if (purchasableInColor) return purchasableInColor;
    if (scoped.length) return scoped[0];
  }

  return variants.find(isPurchasable) ?? variants[0];
}

/**
 * Галерея для обраного артикула: власні фото → фото іншого розміру того
 * самого кольору → об'єднання фото всіх варіантів (щоб картка не лишилась
 * зовсім без фото через прогалину в даних постачальника).
 */
export function galleryFor(variants: readonly CrmProduct[], selected: CrmProduct): string[] {
  const own = selected.images.map((image) => image.url);
  if (own.length) return own;

  if (selected.color) {
    const sibling = variants.find((variant) => variant.color === selected.color && variant.images.length > 0);
    if (sibling) return sibling.images.map((image) => image.url);
  }

  return [...new Set(variants.flatMap((variant) => variant.images.map((image) => image.url)))];
}
