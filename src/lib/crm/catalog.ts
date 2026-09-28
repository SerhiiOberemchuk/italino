import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { toProductCards, type CatalogCard } from "@/lib/catalog/product-cards";
import { crmGet, CrmError } from "./client";
import type {
  CrmBrand,
  CrmBrandList,
  CrmCapabilities,
  CrmCategory,
  CrmCategoryList,
  CrmPagination,
  CrmProduct,
  CrmProductDetail,
  CrmProductList,
} from "./types";

/**
 * Максимум CRM — 100 позицій на сторінку. Це й межа будь-якого завантаження
 * товарів сайтом: один перегляд = одна сторінка CRM, а не весь склад.
 */
const PER_PAGE = 100;
/** Далі цієї сторінки не запитуємо: сміттєві `?page=` не мають плодити записи кешу. */
export const MAX_CATALOG_PAGE = 500;
/** Варіантів однієї моделі — до 300 (зараз максимум 84). */
const MAX_VARIANT_PAGES = 3;
/** Скільки брендів чи категорій максимум перевіряємо на наявність товарів складу. */
const MAX_AVAILABILITY_CHECKS = 24;

function warehouseId(): string {
  const value = process.env.OBRIYM_WAREHOUSE_ID?.trim();
  if (!value) throw new CrmError("WAREHOUSE_NOT_CONFIGURED");
  return value;
}

function validPagination(pagination: CrmPagination | undefined, page: number): pagination is CrmPagination {
  return Number.isInteger(pagination?.page)
    && Number.isInteger(pagination?.perPage)
    && Number.isInteger(pagination?.total)
    && pagination!.page === page
    && pagination!.perPage >= 1
    && pagination!.total >= 0;
}

/** Вітрина показує лише активні й видимі товари складу ITALINO. */
function storeFilter() {
  return {
    warehouseId: warehouseId(),
    status: "active",
    storefrontVisibility: "visible",
  };
}

export type CatalogSort = "newest" | "price_asc" | "price_desc";

export type CatalogQuery = {
  page: number;
  sort: CatalogSort;
  q: string;
  brandId: string;
  categoryId: string;
  discounted: boolean;
};

export type CatalogPage = {
  cards: CatalogCard[];
  page: number;
  pageCount: number;
  /** Моделей за фільтром; `null`, доки CRM віддає артикули, а не моделі. */
  modelCount: number | null;
};

/** Повний і однаково впорядкований запит — стабільний ключ кешу для однакових фільтрів. */
export function catalogQuery(input: Partial<CatalogQuery> = {}): CatalogQuery {
  const page = input.page ?? 1;
  return {
    page: Number.isInteger(page) && page >= 1 ? Math.min(page, MAX_CATALOG_PAGE) : 1,
    sort: input.sort ?? "newest",
    q: input.q?.trim().slice(0, 200) ?? "",
    brandId: input.brandId ?? "",
    categoryId: input.categoryId ?? "",
    discounted: input.discounted ?? false,
  };
}

function isDiscounted(product: CrmProduct): boolean {
  return product.price !== null
    && product.compareAtPrice !== null
    && product.compareAtPrice > product.price;
}

/**
 * Одна сторінка CRM (до 100 артикулів), згорнута в картки моделей. Модель,
 * чиї артикули CRM розклала по двох сторінках, з'явиться на обох — це зникне,
 * коли CRM віддаватиме список моделей.
 */
async function fetchCatalogPage(query: CatalogQuery): Promise<CatalogPage> {
  const result = await crmGet<CrmProductList>("products", {
    ...storeFilter(),
    perPage: PER_PAGE,
    page: query.page,
    sort: query.sort,
    q: query.q || undefined,
    brandId: query.brandId || undefined,
    categoryId: query.categoryId || undefined,
    // CRM поки ігнорує цей фільтр, тому рядки без знижки відкидаємо й тут.
    discounted: query.discounted ? "true" : undefined,
  });
  if (!Array.isArray(result?.data) || !validPagination(result.pagination, query.page)) {
    throw new CrmError("INVALID_PRODUCT_LIST");
  }

  const rows = query.discounted ? result.data.filter(isDiscounted) : result.data;
  return {
    cards: toProductCards(rows),
    page: query.page,
    pageCount: Math.max(1, Math.ceil(result.pagination.total / result.pagination.perPage)),
    modelCount: null,
  };
}

/**
 * Кеш — окремий невеликий запис на кожну комбінацію фільтрів і сторінку.
 * Remote-кеш спільний для serverless-інстансів і скидається webhook-ом.
 */
export async function getCatalogPage(query: CatalogQuery): Promise<CatalogPage> {
  "use cache: remote";
  cacheLife({ stale: 300, revalidate: 300, expire: 86_400 });
  cacheTag("catalog", "products");
  return fetchCatalogPage(query);
}

/** Чи є на складі ITALINO хоч один товар за фільтром: запит на один рядок. */
async function hasStoreProducts(filter: { brandId?: string; categoryId?: string }): Promise<boolean> {
  const result = await crmGet<CrmProductList>("products", {
    ...storeFilter(),
    ...filter,
    perPage: 1,
    page: 1,
  });
  if (!validPagination(result?.pagination, 1)) throw new CrmError("INVALID_PRODUCT_PAGINATION");
  return result.pagination.total > 0;
}

function hasIdAndName<T extends { id?: unknown; name?: unknown }>(item: T): boolean {
  return typeof item?.id === "string"
    && typeof item?.name === "string"
    && item.id.trim().length > 0
    && item.name.trim().length > 0;
}

/**
 * Категорії вітрини з CRM. Порядок відповіді CRM зберігається для навігації.
 * `/categories` спільний для всього workspace, тож кореневу категорію без
 * підкатегорій показуємо, лише якщо в ній є товар складу ITALINO. Підкатегорії
 * не перевіряємо: порожня просто покаже «товарів немає».
 */
export async function getStoreCategories(): Promise<CrmCategory[]> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("catalog", "categories");

  const result = await crmGet<CrmCategoryList>("categories", { warehouseId: warehouseId() });
  if (!Array.isArray(result?.data)) throw new CrmError("INVALID_CATEGORY_LIST");
  const categories = result.data.filter(hasIdAndName);
  const ids = new Set(categories.map((category) => category.id));
  const parentIds = new Set(categories.flatMap((category) => category.parentId ? [category.parentId] : []));
  const lonelyRoots = categories
    .filter((category) => (!category.parentId || !ids.has(category.parentId)) && !parentIds.has(category.id))
    .slice(0, MAX_AVAILABILITY_CHECKS);
  const available = await Promise.all(
    lonelyRoots.map((category) => hasStoreProducts({ categoryId: category.id })),
  );
  const empty = new Set(lonelyRoots.filter((_, index) => !available[index]).map((category) => category.id));
  return categories.filter((category) => !empty.has(category.id));
}

/**
 * Бренди вітрини. `/brands` віддає бренди всього workspace, зокрема чужих
 * складів, тому лишаємо ті, в яких є товар складу ITALINO.
 */
export async function getStoreBrands(): Promise<CrmBrand[]> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("catalog", "products");

  const result = await crmGet<CrmBrandList>("brands", { warehouseId: warehouseId() });
  if (!Array.isArray(result?.data)) throw new CrmError("INVALID_BRAND_LIST");
  const brands = result.data.filter(hasIdAndName).slice(0, MAX_AVAILABILITY_CHECKS);
  const available = await Promise.all(brands.map((brand) => hasStoreProducts({ brandId: brand.id })));
  return brands
    .filter((_, index) => available[index])
    .map((brand) => ({ ...brand, name: brand.name.trim() }))
    .sort((a, b) => a.name.localeCompare(b.name, "uk"));
}

async function fetchProductVariants(key: string): Promise<CrmProduct[]> {
  const query = {
    ...storeFilter(),
    productGroupId: key,
    perPage: PER_PAGE,
    page: 1,
  };
  // productGroupId уже підтримується CRM, хоча його ще немає в опублікованій OpenAPI-схемі.
  const first = await crmGet<CrmProductList>("products", query);
  if (!Array.isArray(first?.data)) throw new CrmError("INVALID_PRODUCT_LIST");
  const exact = first.data.filter((product) => product.productGroupId === key);
  if (exact.length) {
    const totalPages = Math.min(
      MAX_VARIANT_PAGES,
      Math.ceil(first.pagination.total / Math.max(1, first.pagination.perPage)),
    );
    if (totalPages <= 1) return exact;
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => crmGet<CrmProductList>("products", {
        ...query,
        page: index + 2,
      })),
    );
    return [first, ...rest].flatMap((page) => page.data)
      .filter((product) => product.productGroupId === key);
  }

  // Модель без productGroupId має URL за id самого товару.
  if (!/^[a-z0-9_-]+$/i.test(key)) return [];
  try {
    const result = await crmGet<CrmProductDetail>(`products/${key}`);
    const product = result?.data;
    return product
      && product.id === key
      && product.warehouseId === warehouseId()
      && product.status === "active"
      && product.storefrontVisible !== false
      ? [product]
      : [];
  } catch (error) {
    if (error instanceof CrmError && error.status === 404) return [];
    throw error;
  }
}

function validSku(sku: string): boolean {
  return /^[a-z0-9._-]{1,120}$/i.test(sku);
}

async function fetchProductBySku(sku: string): Promise<CrmProduct | null> {
  if (!validSku(sku)) return null;
  try {
    const result = await crmGet<CrmProductDetail>(`products/sku/${sku}`);
    const product = result?.data;
    return product
      && product.sku === sku
      && product.warehouseId === warehouseId()
      && product.status === "active"
      && product.storefrontVisible !== false
      ? product
      : null;
  } catch (error) {
    if (error instanceof CrmError && error.status === 404) return null;
    throw error;
  }
}

export async function getStoreProductBySku(sku: string): Promise<CrmProduct | null> {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("catalog", "products");
  return fetchProductBySku(sku);
}

export async function getLiveProductBySku(sku: string): Promise<CrmProduct | null> {
  return fetchProductBySku(sku);
}

export async function getProductVariants(key: string): Promise<CrmProduct[]> {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("catalog", "products", `product-${key.slice(0, 180)}`);
  return fetchProductVariants(key);
}

export async function getCapabilities() {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("capabilities");
  return (await crmGet<CrmCapabilities>("capabilities")).data;
}

/**
 * Поріг безкоштовної доставки з CRM у гривнях. `null` — поріг не задано,
 * валюта не гривня або CRM недоступна: тоді безкоштовну доставку не обіцяємо.
 * Кешується разом із capabilities; негайно оновити — POST /api/revalidate
 * з тегом `capabilities`.
 */
export async function getFreeShippingThreshold(): Promise<number | null> {
  "use cache: remote";
  cacheLife({ stale: 300, revalidate: 300, expire: 3_600 });
  cacheTag("capabilities");
  try {
    // Keep the fallback inside the cached scope. Cache Components surface a rejected
    // cached call during prerender even when an uncached caller tries to catch it.
    const { cart } = (await crmGet<CrmCapabilities>("capabilities")).data;
    return cart.currency === "UAH" && typeof cart.freeShippingThreshold === "number"
      ? cart.freeShippingThreshold
      : null;
  } catch {
    return null;
  }
}
