import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { createCatalogIndexBuilder, type StoreCatalog } from "@/lib/catalog/catalog-index";
import { crmGet, CrmError } from "./client";
import type {
  CrmCapabilities,
  CrmCategory,
  CrmCategoryList,
  CrmProduct,
  CrmProductDetail,
  CrmProductList,
} from "./types";

/** Максимум CRM: 100 позицій на сторінку. */
const PER_PAGE = 100;
/** Не створюємо 55+ одночасних з'єднань до CRM, але й не чекаємо їх послідовно. */
const PAGE_CONCURRENCY = 10;

function warehouseId(): string {
  const value = process.env.OBRIYM_WAREHOUSE_ID?.trim();
  if (!value) throw new CrmError("WAREHOUSE_NOT_CONFIGURED");
  return value;
}

async function fetchStoreProductPage(page: number, sort?: string): Promise<CrmProductList> {
  const id = warehouseId();
  const result = await crmGet<CrmProductList>("products", {
    warehouseId: id,
    perPage: PER_PAGE,
    page,
    status: "active",
    storefrontVisibility: "visible",
    ...(sort ? { sort } : {}),
  });
  if (!Array.isArray(result?.data)) throw new CrmError("INVALID_PRODUCT_LIST");
  if (
    !Number.isInteger(result.pagination?.page)
    || !Number.isInteger(result.pagination?.perPage)
    || !Number.isInteger(result.pagination?.total)
    || result.pagination.page !== page
    || result.pagination.perPage < 1
    || result.pagination.total < 0
  ) {
    throw new CrmError("INVALID_PRODUCT_PAGINATION");
  }
  return result;
}

async function fetchStoreCatalog(): Promise<StoreCatalog> {
  const first = await fetchStoreProductPage(1, "newest");
  const totalPages = Math.ceil(first.pagination.total / first.pagination.perPage);
  const builder = createCatalogIndexBuilder();
  builder.add(first.data);

  for (let from = 2; from <= totalPages; from += PAGE_CONCURRENCY) {
    const count = Math.min(PAGE_CONCURRENCY, totalPages - from + 1);
    const pages = await Promise.all(
      Array.from({ length: count }, (_, offset) => fetchStoreProductPage(from + offset, "newest")),
    );
    for (const page of pages) {
      if (page.pagination.total !== first.pagination.total) {
        throw new CrmError("PRODUCT_CATALOG_CHANGED");
      }
      builder.add(page.data);
    }
  }

  const catalog = builder.finish();
  if (catalog.productCount !== first.pagination.total) {
    throw new CrmError("INCOMPLETE_PRODUCT_LIST");
  }
  return catalog;
}

/**
 * Каталог для вітрини кешується як компактні моделі, а не як 5+ тисяч повних
 * CRM-рядків. Remote-кеш спільний для serverless-інстансів і скидається webhook-ом.
 */
export async function getStoreCatalog(): Promise<StoreCatalog> {
  "use cache: remote";
  cacheLife({ stale: 300, revalidate: 300, expire: 86_400 });
  cacheTag("catalog", "products");
  return fetchStoreCatalog();
}

async function fetchProductVariants(key: string): Promise<CrmProduct[]> {
  const query = {
    warehouseId: warehouseId(),
    productGroupId: key,
    perPage: PER_PAGE,
    page: 1,
    status: "active",
    storefrontVisibility: "visible",
  };
  // productGroupId уже підтримується CRM, хоча його ще немає в опублікованій OpenAPI-схемі.
  const first = await crmGet<CrmProductList>("products", query);
  if (!Array.isArray(first?.data)) throw new CrmError("INVALID_PRODUCT_LIST");
  const exact = first.data.filter((product) => product.productGroupId === key);
  if (exact.length) {
    const totalPages = Math.ceil(first.pagination.total / Math.max(1, first.pagination.perPage));
    if (totalPages === 1) return exact;
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

/** Категорії вітрини з CRM. Порядок відповіді CRM зберігається для навігації. */
export async function getStoreCategories(): Promise<CrmCategory[]> {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("catalog", "categories");

  const result = await crmGet<CrmCategoryList>("categories");
  if (!Array.isArray(result?.data)) throw new CrmError("INVALID_CATEGORY_LIST");
  return result.data.filter((category) => (
    typeof category?.id === "string"
    && typeof category?.name === "string"
    && category.id.trim().length > 0
    && category.name.trim().length > 0
  ));
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
  try {
    const { cart } = await getCapabilities();
    return cart.currency === "UAH" && typeof cart.freeShippingThreshold === "number"
      ? cart.freeShippingThreshold
      : null;
  } catch {
    return null;
  }
}
