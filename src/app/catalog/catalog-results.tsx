import type { Route } from "next";
import { Suspense, type ReactNode } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import {
  catalogQuery,
  getCatalogPage,
  getStoreBrands,
  type CatalogPage,
  type CatalogSort,
} from "@/lib/crm/catalog";
import type { CrmCategory } from "@/lib/crm/types";
import { CatalogLink } from "./catalog-context";
import { CatalogResultsSkeleton } from "./catalog-skeletons";
import { CatalogResultsBoundary } from "./results-boundary";
import styles from "../shop.module.css";

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

/** Поточні параметри плюс потрібна сторінка; `page=1` в адресу не пишемо. */
function pageHref(basePath: string, params: CatalogSearchParams, page: number): Route {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page") continue;
    const first = Array.isArray(value) ? value[0] : value;
    if (first) search.set(key, first);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return (query ? `${basePath}?${query}` : basePath) as Route;
}

/**
 * Місце результатів на сторінці каталогу. Зовнішня межа — для статичної
 * оболонки (адреса ще невідома), внутрішня — окрема на кожну адресу.
 */
export function CatalogResultsSlot({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<CatalogResultsSkeleton />}>
      <CatalogResultsBoundary fallback={<CatalogResultsSkeleton />}>{children}</CatalogResultsBoundary>
    </Suspense>
  );
}

type CatalogResultsProps = {
  params: CatalogSearchParams;
  /** Сторінка категорії; без неї — увесь каталог. */
  category?: CrmCategory;
  basePath: string;
};

export async function CatalogResults({ params, category, basePath }: CatalogResultsProps) {
  const searchQuery = single(params.q).trim();
  const brandName = single(params.brand);
  const sort: CatalogSort = params.sort === "price_asc" || params.sort === "price_desc" ? params.sort : "newest";
  const discounted = params.discounted === "true";
  const requested = Number(single(params.page) || 1);

  const brands = await getStoreBrands();
  const brand = brands.find((item) => item.name === brandName);
  const query = (page: number) => catalogQuery({
    page,
    sort,
    q: searchQuery,
    brandId: brand?.id,
    categoryId: category?.id,
    onSale: discounted,
  });

  // Фільтри застосовує CRM: один перегляд — одна сторінка моделей, без читання всього складу.
  // Невідомий бренд — порожній результат без запиту.
  let result: CatalogPage | null = null;
  if (!brandName || brand) {
    result = await getCatalogPage(query(Number.isInteger(requested) ? requested : 1));
    // Сторінка за межами результатів — показуємо останню.
    if (result.page > result.pageCount) result = await getCatalogPage(query(result.pageCount));
  }
  const cards = result?.cards ?? [];
  const page = result?.page ?? 1;
  const pageCount = result?.pageCount ?? 1;
  const modelCount = result?.modelCount ?? 0;
  const pageInfo = pageCount > 1 && cards.length ? ` · сторінка ${page} з ${pageCount}` : "";
  const filtered = Boolean(searchQuery || brandName || discounted);

  return (
    <div className={styles.resultsBody}>
      <p className={styles.resultsCount}>Знайдено моделей: {modelCount}{pageInfo}</p>

      {cards.length ? (
        <div className={styles.grid}>
          {cards.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className={styles.empty}>
          <p>За цими параметрами товарів немає.</p>
          {filtered ? (
            <CatalogLink className={`${styles.pagerLink} ${styles.emptyAction}`} href={basePath as Route} history="replace">
              Скинути фільтри
            </CatalogLink>
          ) : null}
        </div>
      )}

      {pageCount > 1 && cards.length ? (
        <nav className={styles.pager} aria-label="Сторінки каталогу">
          {page > 1
            ? <CatalogLink className={styles.pagerLink} href={pageHref(basePath, params, page - 1)} rel="prev" scrollToResults>← Назад</CatalogLink>
            : <span className={`${styles.pagerLink} ${styles.pagerMuted}`} aria-hidden="true">← Назад</span>}
          <span className={styles.pagerInfo}>{page} / {pageCount}</span>
          {page < pageCount
            ? <CatalogLink className={styles.pagerLink} href={pageHref(basePath, params, page + 1)} rel="next" scrollToResults>Далі →</CatalogLink>
            : <span className={`${styles.pagerLink} ${styles.pagerMuted}`} aria-hidden="true">Далі →</span>}
        </nav>
      ) : null}
    </div>
  );
}
