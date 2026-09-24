import type { Route } from "next";
import type { CatalogModel } from "@/lib/catalog/catalog-index";

export type CatalogBrand = {
  id: string;
  name: string;
  href: Route;
  image: string | null;
  modelCount: number;
};

export function catalogBrands(models: readonly CatalogModel[]): CatalogBrand[] {
  const brands = new Map<string, {
    id: string;
    name: string;
    image: string | null;
    models: Set<string>;
  }>();

  for (const model of models) {
    const name = model.brand?.trim();
    if (!model.brandId || !name) continue;

    const brand = brands.get(model.brandId) ?? {
      id: model.brandId,
      name,
      image: null,
      models: new Set<string>(),
    };
    brand.models.add(model.id);
    brand.image ??= model.image;
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
