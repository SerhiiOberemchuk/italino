import type { Route } from "next";
import type { CrmProduct } from "@/lib/crm/types";

export type CatalogBrand = {
  id: string;
  name: string;
  href: Route;
  image: string | null;
  modelCount: number;
};

export function catalogBrands(products: readonly CrmProduct[]): CatalogBrand[] {
  const brands = new Map<string, {
    id: string;
    name: string;
    image: string | null;
    models: Set<string>;
  }>();

  for (const product of products) {
    const name = product.brand?.name?.trim();
    if (!product.brand?.id || !name) continue;

    const brand = brands.get(product.brand.id) ?? {
      id: product.brand.id,
      name,
      image: null,
      models: new Set<string>(),
    };
    brand.models.add(product.productGroupId ?? product.id);
    brand.image ??= product.images[0]?.url ?? null;
    brands.set(brand.id, brand);
  }

  return [...brands.values()]
    .map((brand) => ({
      id: brand.id,
      name: brand.name,
      href: `/catalog?brand=${encodeURIComponent(brand.name)}` as Route,
      image: brand.image,
      modelCount: brand.models.size,
    }))
    .sort((a, b) => b.modelCount - a.modelCount || a.name.localeCompare(b.name, "uk"));
}
