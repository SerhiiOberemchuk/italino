import type { Route } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { CustomSelect } from "@/components/ui/custom-select";
import { saleCard, type StoreCatalog } from "@/lib/catalog/catalog-index";
import { getStoreCatalog } from "@/lib/crm/catalog";
import styles from "../shop.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

const PAGE_SIZE = 24;

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
};

export async function CatalogContent({ searchParams, categoryIds, basePath = "/catalog", catalog }: Props) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().toLocaleLowerCase("uk") : "";
  const brand = typeof params.brand === "string" ? params.brand : "";
  const sort = typeof params.sort === "string" ? params.sort : "newest";
  const discounted = params.discounted === "true";

  // У кеші одна компактна модель на всі її кольори/розміри, а не тисячі CRM-рядків.
  const all = (catalog ?? await getStoreCatalog()).models;
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
    <div className={styles.catalogLayout}>
      <form className={styles.filters} id="catalog-filters">
        <label>Пошук
          <input className={styles.input} type="search" name="q" defaultValue={query} placeholder="Назва або артикул" />
        </label>
        <CustomSelect
          label="Бренд"
          name="brand"
          value={brand}
          options={[{ value: "", label: "Усі бренди" }, ...brands.map((name) => ({ value: name, label: name }))]}
        />
        <CustomSelect
          label="Сортування"
          name="sort"
          value={sort}
          options={[
            { value: "newest", label: "Новинки" },
            { value: "price_asc", label: "Ціна: від нижчої" },
            { value: "price_desc", label: "Ціна: від вищої" },
          ]}
        />
        {discounted ? <input type="hidden" name="discounted" value="true" /> : null}
        <button className={styles.primary} type="submit">Застосувати</button>
      </form>

      <section aria-label="Товари">
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
      </section>
    </div>
  );
}
