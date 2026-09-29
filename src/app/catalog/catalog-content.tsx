import type { Route } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { categoryKey, categoryLinks } from "@/lib/catalog/categories";
import {
  catalogQuery,
  getCatalogPage,
  getStoreBrands,
  getStoreCategories,
  type CatalogPage,
  type CatalogSort,
} from "@/lib/crm/catalog";
import type { CrmCategory } from "@/lib/crm/types";
import { CatalogShell } from "./catalog-shell";
import styles from "../shop.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

/** Поточні параметри плюс потрібна сторінка; `page=1` в адресу не пишемо. */
function pageHref(basePath: string, params: SearchParams, page: number): Route {
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

type Props = {
  searchParams: Promise<SearchParams>;
  /** Сторінка категорії; без неї — увесь каталог. */
  category?: CrmCategory;
  basePath?: string;
};

export async function CatalogContent({ searchParams, category, basePath = "/catalog" }: Props) {
  const params = await searchParams;
  const searchQuery = single(params.q).trim();
  const brandName = single(params.brand);
  const sort: CatalogSort = params.sort === "price_asc" || params.sort === "price_desc" ? params.sort : "newest";
  const discounted = params.discounted === "true";
  const requested = Number(single(params.page) || 1);

  const [categories, brands] = await Promise.all([getStoreCategories(), getStoreBrands()]);
  const brand = brands.find((item) => item.name === brandName);
  const subcategories = category ? categories.filter((item) => item.parentId === category.id) : [];
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

  return (
    <CatalogShell
      basePath={basePath}
      brands={brands.map((item) => item.name).sort((a, b) => a.localeCompare(b, "uk"))}
      categories={categoryLinks(categories)}
      initialBrand={brandName}
      initialQuery={searchQuery}
      initialSort={sort}
    >
      {subcategories.length ? (
        <nav className={styles.subcategories} aria-label="Підкатегорії">
          {subcategories.map((item) => (
            <Link
              key={item.id}
              className={styles.pagerLink}
              href={`/catalog/${encodeURIComponent(categoryKey(item))}` as Route}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      ) : null}

      <p className="section-lead">Знайдено моделей: {modelCount}{pageInfo}</p>

      {cards.length ? (
        <div className={styles.grid}>
          {cards.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <p className={styles.empty}>За цими параметрами товарів немає.</p>
      )}

      {pageCount > 1 && cards.length ? (
        <nav className={styles.pager} aria-label="Сторінки каталогу">
          {page > 1
            ? <Link className={styles.pagerLink} href={pageHref(basePath, params, page - 1)} rel="prev">← Назад</Link>
            : <span className={`${styles.pagerLink} ${styles.pagerMuted}`} aria-hidden="true">← Назад</span>}
          <span className={styles.pagerInfo}>{page} / {pageCount}</span>
          {page < pageCount
            ? <Link className={styles.pagerLink} href={pageHref(basePath, params, page + 1)} rel="next">Далі →</Link>
            : <span className={`${styles.pagerLink} ${styles.pagerMuted}`} aria-hidden="true">Далі →</span>}
        </nav>
      ) : null}
    </CatalogShell>
  );
}
