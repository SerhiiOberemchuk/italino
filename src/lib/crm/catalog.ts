import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { crmGet, CrmError } from "./client";
import type { CrmCapabilities, CrmProduct, CrmProductList } from "./types";

/** Максимум CRM: 100 позицій на сторінку. */
const PER_PAGE = 100;
/** Стеля на кількість запитів за один прохід — щоб виріс каталог, а не час відповіді. */
const MAX_PAGES = 20;

function warehouseId(): string {
  const value = process.env.OBRIYM_WAREHOUSE_ID?.trim();
  if (!value) throw new CrmError("WAREHOUSE_NOT_CONFIGURED");
  return value;
}

/**
 * Усі видимі активні товари складу ITALINO. CRM віддає каталог посторінково,
 * тож фільтри й сортування вітрини працюють по повному набору, а не по першій
 * сторінці. Кешуванням керує той, хто викликає.
 */
async function fetchStoreProducts(sort?: string): Promise<CrmProduct[]> {
  const id = warehouseId();
  const products: CrmProduct[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await crmGet<CrmProductList>("products", {
      warehouseId: id,
      perPage: PER_PAGE,
      page,
      status: "active",
      storefrontVisibility: "visible",
      ...(sort ? { sort } : {}),
    });
    if (!Array.isArray(result?.data)) throw new CrmError("INVALID_PRODUCT_LIST");
    products.push(...result.data);

    const total = result.pagination?.total;
    if (result.data.length < PER_PAGE || (typeof total === "number" && products.length >= total)) break;
  }

  return products;
}

/** Обмежена добірка для головної: лише перша сторінка новинок. */
export async function getHomeProducts() {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", "products");

  const result = await crmGet<CrmProductList>("products", {
    warehouseId: warehouseId(),
    perPage: PER_PAGE,
    page: 1,
    sort: "newest",
    status: "active",
    storefrontVisibility: "visible",
  });
  if (!Array.isArray(result?.data)) throw new CrmError("INVALID_PRODUCT_LIST");
  return result.data;
}

/** Каталог для перегляду: кешований зріз, оновлюється за тегом `products`. */
export async function getStoreProducts() {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", "products");
  return fetchStoreProducts();
}

/**
 * Каталог без кешу — лише для фінальної перевірки цін і залишків перед
 * створенням замовлення. Кешований зріз тут не годиться: за кілька хвилин
 * життя запису залишок у CRM міг змінитися, і магазин продав би те, чого немає.
 */
export async function getLiveProducts(): Promise<CrmProduct[]> {
  return fetchStoreProducts();
}

export async function getProductVariants(key: string): Promise<CrmProduct[]> {
  const products = await getStoreProducts();
  return products.filter((product) => (product.productGroupId ?? product.id) === key);
}

export async function getCapabilities() {
  "use cache";
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
