import type { Route } from "next";
import type { CrmProduct } from "@/lib/crm/types";
import { sortSizes, type ProductCard } from "./product-cards";

/** Компактна модель каталогу: одна картка замість усіх рядків «колір × розмір». */
export type CatalogModel = ProductCard & {
  brandId: string | null;
  categoryIds: string[];
  searchText: string;
  updatedAt: string;
  variantCount: number;
  salePrice: number | null;
  saleCompareAtPrice: number | null;
};

export type StoreCatalog = {
  models: CatalogModel[];
  productCount: number;
};

type MutableModel = {
  id: string;
  name: string;
  brand: string | null;
  brandId: string | null;
  image: string | null;
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  colors: Set<string>;
  sizes: Set<string>;
  categoryIds: Set<string>;
  searchParts: string[];
  updatedAt: string;
  variantCount: number;
  hasNewTag: boolean;
  salePrice: number | null;
  saleCompareAtPrice: number | null;
};

function discountPercent(price: number | null, compareAtPrice: number | null): number | null {
  return price !== null && compareAtPrice !== null && compareAtPrice > price
    ? Math.round((1 - price / compareAtPrice) * 100)
    : null;
}

/**
 * Будує індекс поступово, щоб під час синхронізації 5+ тисяч CRM-позицій не
 * тримати в пам'яті весь сирий каталог і не класти десятки мегабайт у кеш.
 */
export function createCatalogIndexBuilder() {
  const models = new Map<string, MutableModel>();
  let productCount = 0;

  const add = (products: readonly CrmProduct[]) => {
    productCount += products.length;

    for (const product of products) {
      if (product.status !== "active") continue;
      const id = product.productGroupId ?? product.id;
      let model = models.get(id);

      if (!model) {
        model = {
          id,
          name: product.name,
          brand: product.brand?.name?.trim() || null,
          brandId: product.brand?.id ?? null,
          image: product.images[0]?.url ?? null,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          currency: product.currency,
          colors: new Set(),
          sizes: new Set(),
          categoryIds: new Set(),
          searchParts: [],
          updatedAt: product.updatedAt,
          variantCount: 0,
          hasNewTag: false,
          salePrice: null,
          saleCompareAtPrice: null,
        };
        models.set(id, model);
      }

      model.variantCount += 1;
      model.image ??= product.images[0]?.url ?? null;
      model.hasNewTag ||= product.tags.includes("new");
      if (product.updatedAt > model.updatedAt) model.updatedAt = product.updatedAt;
      if (product.color) model.colors.add(product.color);
      if (product.size) model.sizes.add(product.size);
      if (product.category?.id) model.categoryIds.add(product.category.id);
      model.searchParts.push(
        product.name,
        product.sku ?? "",
        product.brand?.name ?? "",
        product.category?.name ?? "",
      );

      if (product.price !== null && (model.price === null || product.price < model.price)) {
        model.price = product.price;
        model.compareAtPrice = product.compareAtPrice;
        model.currency = product.currency;
      }

      if (
        product.price !== null
        && product.compareAtPrice !== null
        && product.compareAtPrice > product.price
        && (model.salePrice === null || product.price < model.salePrice)
      ) {
        model.salePrice = product.price;
        model.saleCompareAtPrice = product.compareAtPrice;
      }
    }
  };

  const finish = (): StoreCatalog => ({
    productCount,
    models: [...models.values()].map((model) => {
      const percent = discountPercent(model.price, model.compareAtPrice);
      return {
        id: model.id,
        href: `/product/${encodeURIComponent(model.id)}` as Route,
        name: model.name,
        brand: model.brand,
        brandId: model.brandId,
        image: model.image,
        imageAlt: model.name,
        price: model.price,
        compareAtPrice: model.compareAtPrice,
        currency: model.currency,
        colors: [...model.colors],
        sizes: sortSizes(model.sizes),
        badge: percent ? "sale" : model.hasNewTag ? "new" : null,
        discountPercent: percent,
        categoryIds: [...model.categoryIds],
        searchText: model.searchParts.join(" ").toLocaleLowerCase("uk"),
        updatedAt: model.updatedAt,
        variantCount: model.variantCount,
        salePrice: model.salePrice,
        saleCompareAtPrice: model.saleCompareAtPrice,
      };
    }),
  });

  return { add, finish };
}

/** Для sale-каталогу ціна й знижка беруться саме з акційного варіанта моделі. */
export function saleCard(model: CatalogModel): ProductCard {
  const percent = discountPercent(model.salePrice, model.saleCompareAtPrice);
  return {
    ...model,
    price: model.salePrice,
    compareAtPrice: model.saleCompareAtPrice,
    badge: percent ? "sale" : null,
    discountPercent: percent,
  };
}
