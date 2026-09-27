import type { Route } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { saleCard, type StoreCatalog } from "@/lib/catalog/catalog-index";
import { categoryLinks, usedCategoriesByIds } from "@/lib/catalog/categories";
import { getStoreCatalog, getStoreCategories } from "@/lib/crm/catalog";
import type { CrmCategory } from "@/lib/crm/types";
import { CatalogShell } from "./catalog-shell";
import styles from "../shop.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

const PAGE_SIZE = 24;
type SortValue = "newest" | "price_asc" | "price_desc";

/** Поточні параметри плюс потрібна сторінка; `page=1` в адресу не пишемо. */
function pageHref(basePath: string, params: SearchParams, page: number): Route {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page") continue;
    const single = Array.isArray(value) ? value[0] : value;
    if (single) search.set(key, single);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return (query ? `${basePath}?${query}` : basePath) as Route;
}

type Props = {
  searchParams: Promise<SearchParams>;
  categoryIds?: readonly string[];
  basePath?: string;
  catalog?: StoreCatalog;
  categories?: readonly CrmCategory[];
};

export async function CatalogContent({ searchParams, categoryIds, basePath = "/catalog", catalog, categories }: Props) {
  const params = await searchParams;
  const searchQuery = typeof params.q === "string" ? params.q.trim() : "";
  const query = searchQuery.toLocaleLowerCase("uk");
  const brand = typeof params.brand === "string" ? params.brand : "";
  const sort: SortValue = params.sort === "price_asc" || params.sort === "price_desc" ? params.sort : "newest";
  const discounted = params.discounted === "true";

  // У кеші одна компактна модель на всі її кольори/розміри, а не тисячі CRM-рядків.
  const [storeCatalog, allCategories] = await Promise.all([
    catalog ?? getStoreCatalog(),
    categories ?? getStoreCategories(),
  ]);
  const all = storeCatalog.models;
  const visibleCategories = usedCategoriesByIds(
    allCategories,
    all.flatMap((model) => model.categoryIds),
  );
  const brands = [...new Set(all.flatMap((model) => model.brand ? [model.brand] : []))].sort();
  const allowedCategoryIds = categoryIds ? new Set(categoryIds) : null;

  const filtered = all.filter((model) => {
    return (!query || model.searchText.includes(query))
      && (!brand || model.brand === brand)
      && (!discounted || model.salePrice !== null)
      && (!allowedCategoryIds || model.categoryIds.some((id) => allowedCategoryIds.has(id)));
  });

  const cards = filtered.map((model) => discounted ? saleCard(model) : model).sort((a, b) =>
    sort === "price_asc" ? (a.price ?? Infinity) - (b.price ?? Infinity)
      : sort === "price_desc" ? (b.price ?? -Infinity) - (a.price ?? -Infinity)
        : 0);

  const pageCount = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
  const requested = Number(typeof params.page === "string" ? params.page : 1);
  const page = Math.min(Math.max(Number.isInteger(requested) ? requested : 1, 1), pageCount);
  const visible = cards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <CatalogShell
      basePath={basePath}
      brands={brands}
      categories={categoryLinks(visibleCategories)}
      initialBrand={brand}
      initialQuery={searchQuery}
      initialSort={sort}
    >
      <p className="section-lead">
        Знайдено моделей: {cards.length}
        {pageCount > 1 ? ` · сторінка ${page} з ${pageCount}` : ""}
      </p>

      {visible.length ? (
        <div className={styles.grid}>
          {visible.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <p className={styles.empty}>За цими параметрами товарів немає.</p>
      )}

      {pageCount > 1 ? (
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
