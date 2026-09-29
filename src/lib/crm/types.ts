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
export type CrmProductAttribute = { name: string; unit: string | null; value: string };

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
  warehouseId?: string | null;
  storefrontVisible?: boolean;
  barcode?: string | null;
  attributes?: CrmProductAttribute[];
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
export type CrmProductDetail = { data: CrmProduct };

export type CrmCategory = {
  id: string;
  name: string;
  slug: string | null;
  parentId: string | null;
  imageUrl?: string | null;
  /** Лише з `withProductCounts=true`; разом із підкатегоріями. */
  modelCount?: number;
};

export type CrmCategoryList = { data: CrmCategory[] };

export type CrmBrand = {
  id: string;
  name: string;
  slug: string | null;
  imageUrl: string | null;
};

export type CrmBrandList = { data: CrmBrand[] };

/** Найдешевший варіант моделі зі знижкою. */
export type CrmModelSale = {
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  image: CrmProductImage | null;
};

/** Картка моделі з `GET /models`: одна на модель, ціна/фото/SKU — найдешевшого варіанта. */
export type CrmModel = {
  /** Код моделі (productGroupId) або id товару поза моделлю — ключ у URL сайту. */
  key: string;
  code: string | null;
  name: string;
  brand: { id: string; name: string | null } | null;
  category: { id: string; name: string | null; parentId: string | null } | null;
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  sku: string | null;
  image: CrmProductImage | null;
  sale: CrmModelSale | null;
  colors: string[];
  sizes: string[];
  availability: "in_stock" | "on_order" | "preorder" | "out_of_stock" | "discontinued";
  variantCount: number;
  tags: string[];
  updatedAt: string;
};

export type CrmModelFacets = {
  brands: { id: string; name: string; count: number }[];
  colors: { value: string; count: number }[];
  sizes: { value: string; count: number }[];
  price: { min: number; max: number } | null;
};

export type CrmModelList = {
  data: CrmModel[];
  pagination: CrmPagination;
  facets?: CrmModelFacets;
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

export type CrmCapabilityMethod = {
  key: string;
  kind: "builtin" | "adapter";
  label: string;
  modes?: string[];
  paymentLink?: boolean;
  status: "active";
};

export type CrmCapabilities = {
  data: {
    cart: { currency: string; freeShippingThreshold: number | null; minOrderAmount: number | null };
    payments: CrmCapabilityMethod[];
    shipping: CrmCapabilityMethod[];
  };
};

export type CrmOrderIntakeResponse = {
  data: {
    id: string;
    externalId: string;
    status: CrmOrderStatus;
    importStatus: "created" | "existing";
    deduplicated: boolean;
  };
};
