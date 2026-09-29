import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { CATALOG_PAGE_SIZE } from "@/lib/catalog/page-size";
import { modelCard, type CatalogCard } from "@/lib/catalog/product-cards";
import { crmGet, CrmError } from "./client";
import type {
  CrmBrandList,
  CrmCapabilities,
  CrmCategory,
  CrmCategoryList,
  CrmModelList,
  CrmPagination,
  CrmProduct,
  CrmProductDetail,
  CrmProductList,
} from "./types";

/** Моделей в одному товарному sitemap-файлі (максимум CRM). */
export const SITEMAP_PAGE_SIZE = 100;
/** Максимум CRM для `keys`: обране читається одним запитом. */
export const MAX_MODEL_KEYS = 100;
/** Далі цієї сторінки не запитуємо: сміттєві `?page=` не мають плодити записи кешу. */
export const MAX_CATALOG_PAGE = 500;
/** Максимум CRM — 100 рядків на сторінку `/products` (варіанти однієї моделі). */
const PER_PAGE = 100;
/** Варіантів однієї моделі — до 300 (зараз максимум 84). */
const MAX_VARIANT_PAGES = 3;

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

/** Полиці вітрини ще й без моделей без ціни: їх не купити. */
function shelfFilter() {
  return { ...storeFilter(), minPrice: 0 };
}

async function fetchModels(
  query: Record<string, string | number | undefined>,
  page: number,
): Promise<CrmModelList> {
  const result = await crmGet<CrmModelList>("models", { ...query, page });
  if (!Array.isArray(result?.data) || !validPagination(result.pagination, page)) {
    throw new CrmError("INVALID_MODEL_LIST");
  }
  return result;
}

export type CatalogSort = "newest" | "price_asc" | "price_desc";

export type CatalogQuery = {
  page: number;
  sort: CatalogSort;
  q: string;
  brandId: string;
  categoryId: string;
  onSale: boolean;
};

export type CatalogPage = {
  cards: CatalogCard[];
  page: number;
  pageCount: number;
  /** Моделей за фільтром. */
  modelCount: number;
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
    onSale: input.onSale ?? false,
  };
}

async function fetchCatalogPage(query: CatalogQuery): Promise<CatalogPage> {
  const result = await fetchModels({
    ...shelfFilter(),
    perPage: CATALOG_PAGE_SIZE,
    sort: query.sort,
    q: query.q || undefined,
    brandId: query.brandId || undefined,
    categoryId: query.categoryId || undefined,
    // Батьківська категорія показує й моделі своїх підкатегорій.
    includeSubcategories: query.categoryId ? "true" : undefined,
    onSale: query.onSale ? "true" : undefined,
  }, query.page);

  const { total, perPage } = result.pagination;
  return {
    cards: result.data.map((model) => modelCard(model, query.onSale)),
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
    modelCount: total,
  };
}

/**
 * Одна сторінка моделей CRM (24 картки, ~14 КБ). Кеш — окремий невеликий запис
 * на кожну комбінацію фільтрів і сторінку; remote-кеш спільний для
 * serverless-інстансів.
 */
export async function getCatalogPage(query: CatalogQuery): Promise<CatalogPage> {
  "use cache: remote";
  cacheLife({ stale: 300, revalidate: 300, expire: 86_400 });
  cacheTag("catalog", "products");
  return fetchCatalogPage(query);
}

/** Картки обраного одним запитом (`keys`, до 100) у збереженому порядку. */
export async function getModelCards(keys: readonly string[]): Promise<CatalogCard[]> {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("catalog", "products");

  const unique = [...new Set(keys)].slice(0, MAX_MODEL_KEYS);
  if (!unique.length) return [];
  const result = await fetchModels({
    ...storeFilter(),
    keys: unique.join(","),
    perPage: unique.length,
  }, 1);
  return result.data.map((model) => modelCard(model));
}

export type SitemapModel = { key: string; updatedAt: string };

/** Моделі одного товарного sitemap-файлу. */
export async function getSitemapModels(page: number): Promise<SitemapModel[]> {
  "use cache: remote";
  cacheLife("days");
  cacheTag("catalog", "products");

  const result = await fetchModels({
    ...shelfFilter(),
    perPage: SITEMAP_PAGE_SIZE,
    sort: "newest",
  }, page);
  return result.data.map((model) => ({ key: model.key, updatedAt: model.updatedAt }));
}

function hasIdAndName(item: { id?: unknown; name?: unknown }): boolean {
  return typeof item?.id === "string"
    && typeof item?.name === "string"
    && item.id.trim().length > 0
    && item.name.trim().length > 0;
}

/**
 * Категорії вітрини — лише ті, де є моделі складу ITALINO (лічильник CRM уже
 * враховує підкатегорії). Порядок відповіді CRM зберігається для навігації.
 */
export async function getStoreCategories(): Promise<CrmCategory[]> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("catalog", "categories");

  const result = await crmGet<CrmCategoryList>("categories", {
    withProductCounts: "true",
    warehouseId: warehouseId(),
  });
  if (!Array.isArray(result?.data)) throw new CrmError("INVALID_CATEGORY_LIST");
  return result.data
    .filter((category) => hasIdAndName(category) && (category.modelCount ?? 0) > 0)
    .map((category) => ({
      id: category.id,
      name: category.name.trim(),
      slug: category.slug,
      parentId: category.parentId,
      imageUrl: category.imageUrl ?? null,
      modelCount: category.modelCount,
    }));
}

export type StoreBrand = {
  id: string;
  name: string;
  imageUrl: string | null;
  modelCount: number;
};

/**
 * Бренди вітрини — фасет `/models`: лише склад ITALINO, з кількістю моделей.
 * `/brands` віддає бренди всього workspace, тож із нього беремо тільки логотипи.
 */
export async function getStoreBrands(): Promise<StoreBrand[]> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("catalog", "products");

  const [models, brands] = await Promise.all([
    fetchModels({ ...shelfFilter(), perPage: 1, facets: "true" }, 1),
    crmGet<CrmBrandList>("brands"),
  ]);
  if (!Array.isArray(models.facets?.brands)) throw new CrmError("INVALID_MODEL_FACETS");
  const images = new Map((Array.isArray(brands?.data) ? brands.data : [])
    .map((brand) => [brand.id, brand.imageUrl]));
  return models.facets.brands
    .filter((brand) => brand.count > 0 && hasIdAndName(brand))
    .map((brand) => ({
      id: brand.id,
      name: brand.name.trim(),
      imageUrl: images.get(brand.id) || null,
      modelCount: brand.count,
    }))
    .sort((a, b) => b.modelCount - a.modelCount || a.name.localeCompare(b.name, "uk"));
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
