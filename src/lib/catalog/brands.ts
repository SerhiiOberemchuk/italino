import type { Route } from "next";
import type { CrmBrand } from "@/lib/crm/types";

export type CatalogBrand = {
  id: string;
  name: string;
  href: Route;
  image: string | null;
};

/** Посилання брендів вітрини: фільтр каталогу за назвою, фото — власне фото бренду з CRM. */
export function brandLinks(brands: readonly CrmBrand[]): CatalogBrand[] {
  return brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    href: `/catalog?brand=${encodeURIComponent(brand.name)}` as Route,
    image: brand.imageUrl || null,
  }));
}
