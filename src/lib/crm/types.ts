/**
 * Типи публічного API Obriym CRM (`/api/v1/*`), звужені до полів, які читає
 * вітрина. Повний контракт — `GET /api/v1/openapi.json` у CRM.
 * Докладніше: docs/CRM_INTEGRATION.md.
 */

export type CrmProductPrice = {
  currency: string;
  price: number;
  compareAtPrice: number | null;
};

export type CrmProductImage = { url: string };

export type CrmProductStatus = "draft" | "active" | "archived";

export type CrmProduct = {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  status: CrmProductStatus;
  /** Заява продавця про наявність: in_stock | on_order | out_of_stock | preorder | discontinued */
  availability: string;
  /** Ціна за замовчуванням (валюта workspace); повний перелік — у `prices`. */
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  prices: CrmProductPrice[];
  images: CrmProductImage[];
  brand: { id: string; name: string | null } | null;
  category: { id: string; name: string | null; parentId: string | null } | null;
  /** Код моделі, спільний для всіх розмірів/кольорів однієї речі. */
  productGroupId: string | null;
  size: string | null;
  sizeSystem: string | null;
  color: string | null;
  gender: "male" | "female" | "unisex" | null;
  material: string | null;
  /** null, якщо для товару не ведеться облік залишків (trackInventory=false). */
  stock: number | null;
  tags: string[];
  updatedAt: string;
};

export type CrmPagination = { page: number; perPage: number; total: number };

export type CrmProductList = { data: CrmProduct[]; pagination: CrmPagination };

export type CrmCategory = {
  id: string;
  name: string;
  slug: string | null;
  parentId: string | null;
};

export type CrmCollection = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: { url: string } | null;
  sortOrder: number;
};

export type CrmCollectionDetail = CrmCollection & {
  products: { id: string; name: string; sku: string | null }[];
};

export type CrmOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type CrmApiError = {
  code: string;
  message: string;
  requestId: string;
  details?: { field: string; message: string }[];
};
