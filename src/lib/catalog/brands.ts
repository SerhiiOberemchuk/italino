import type { Route } from "next";

export type CatalogBrand = {
  id: string;
  name: string;
  href: Route;
  image: string | null;
  modelCount: number;
};

/** Посилання брендів вітрини: фільтр каталогу за назвою, фото — логотип бренду з CRM. */
export function brandLinks(
  brands: readonly { id: string; name: string; imageUrl: string | null; modelCount: number }[],
): CatalogBrand[] {
  return brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    href: `/catalog?brand=${encodeURIComponent(brand.name)}` as Route,
    image: brand.imageUrl,
    modelCount: brand.modelCount,
  }));
}
