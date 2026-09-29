import { connection } from "next/server";
import { Suspense } from "react";
import { categoryLinks } from "@/lib/catalog/categories";
import { getStoreBrands, getStoreCategories } from "@/lib/crm/catalog";
import { CatalogProvider } from "./catalog-context";
import { CatalogFilters } from "./catalog-filters";
import { CatalogHero, CatalogSubcategories } from "./catalog-hero";
import { CatalogFiltersSkeleton, CatalogHeroSkeleton, CatalogResultsSkeleton } from "./catalog-skeletons";
import { CatalogResultsFrame } from "./results-boundary";
import styles from "../shop.module.css";

/**
 * Дані оболонки каталогу — з кешу CRM, тож потрапляють у статичну оболонку й
 * під час переходів фільтри малюються одразу. Якщо CRM недоступна під час
 * збірки, порожні фільтри не запікаються: блок стає динамічним і повторює
 * запит уже під час відвідування.
 */
async function shellData<T>(scope: string, load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (error) {
    console.error(scope, error instanceof Error ? error.message : "Unknown error");
    await connection();
    return load();
  }
}

/**
 * Спільна оболонка `/catalog` і `/catalog/[category]`. Шапка, фільтри й
 * підкатегорії живуть тут і не перемонтовуються під час переходів — сторінки
 * рендерять лише результати. Кожен блок має власний `<Suspense>` зі
 * скелетоном тієї самої геометрії.
 */
export default function CatalogLayout({ children }: LayoutProps<"/catalog">) {
  const categories = shellData("[CRM categories]", async () => categoryLinks(await getStoreCategories()));
  const brands = shellData("[CRM brands]", async () => (await getStoreBrands())
    .map((brand) => brand.name)
    .sort((a, b) => a.localeCompare(b, "uk")));

  return (
    <main className={`wrap ${styles.page}`}>
      <CatalogProvider categories={categories} brands={brands}>
        <Suspense fallback={<CatalogHeroSkeleton />}>
          <CatalogHero />
        </Suspense>

        <div className={styles.catalogLayout}>
          <div className={styles.filters} id="catalog-filters">
            <Suspense fallback={<CatalogFiltersSkeleton />}>
              <CatalogFilters />
            </Suspense>
          </div>

          <section className={styles.catalogResults} id="catalog-results" aria-label="Товари">
            <Suspense fallback={null}>
              <CatalogSubcategories />
            </Suspense>
            <CatalogResultsFrame skeleton={<CatalogResultsSkeleton />}>{children}</CatalogResultsFrame>
          </section>
        </div>
      </CatalogProvider>
    </main>
  );
}
