import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { crmGet, CrmError } from "./client";
import type { CrmCapabilities, CrmProduct, CrmProductList } from "./types";

/** A bounded catalog preview; the full catalog uses separate paginated requests. */
export async function getHomeProducts() {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", "products");

  const warehouseId = process.env.OBRIYM_WAREHOUSE_ID?.trim();
  if (!warehouseId) throw new CrmError("WAREHOUSE_NOT_CONFIGURED");

  const result = await crmGet<CrmProductList>("products", {
    warehouseId,
    perPage: 100,
    page: 1,
    sort: "newest",
    status: "active",
    storefrontVisibility: "visible",
  });
  if (!Array.isArray(result?.data)) throw new CrmError("INVALID_PRODUCT_LIST");
  return result.data;
}

export async function getStoreProducts() {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", "products");

  const warehouseId = process.env.OBRIYM_WAREHOUSE_ID?.trim();
  if (!warehouseId) throw new CrmError("WAREHOUSE_NOT_CONFIGURED");
  const result = await crmGet<CrmProductList>("products", {
    warehouseId,
    perPage: 100,
    page: 1,
    status: "active",
    storefrontVisibility: "visible",
  });
  if (!Array.isArray(result?.data)) throw new CrmError("INVALID_PRODUCT_LIST");
  return result.data;
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
