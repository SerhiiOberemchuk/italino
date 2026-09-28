"use client";

import type { Route } from "next";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomSelect } from "@/components/ui/custom-select";
import type { CatalogCategoryLink } from "@/lib/catalog/categories";
import styles from "../shop.module.css";

const FILTER_DELAY_MS = 300;

type SortValue = "newest" | "price_asc" | "price_desc";

type CatalogShellProps = {
  basePath: string;
  brands: string[];
  categories: CatalogCategoryLink[];
  initialBrand: string;
  initialQuery: string;
  initialSort: SortValue;
  children: ReactNode;
};

function filterKey(path: string, query: string, brand: string, sort: SortValue): string {
  return `${path}\u0000${query.trim()}\u0000${brand}\u0000${sort}`;
}

export function CatalogShell({
  basePath,
  brands,
  categories,
  initialBrand,
  initialQuery,
  initialSort,
  children,
}: CatalogShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [categoryPath, setCategoryPath] = useState(basePath);
  const [query, setQuery] = useState(initialQuery);
  const [brand, setBrand] = useState(initialBrand);
  const [sort, setSort] = useState<SortValue>(initialSort);
  const committedFiltersRef = useRef(filterKey(basePath, initialQuery, initialBrand, initialSort));
  const requestedFiltersRef = useRef<string | null>(null);

  // Cache Components зберігають цей клієнтський shell між навігаціями.
  // Синхронізація потрібна для переходів Back/Forward і посилань пагінації.
  useEffect(() => {
    const committedFilters = filterKey(basePath, initialQuery, initialBrand, initialSort);
    if (committedFiltersRef.current === committedFilters) return;

    const requestedFilters = requestedFiltersRef.current;
    if (requestedFilters !== null) {
      // Ignore an older RSC response when a newer debounced filter request is in flight.
      if (requestedFilters !== committedFilters) return;
      requestedFiltersRef.current = null;
      committedFiltersRef.current = committedFilters;
      // Do not overwrite text typed while the matching server response was travelling.
      if (filterKey(categoryPath, query, brand, sort) !== committedFilters) return;
    } else {
      // Back/Forward and direct links are authoritative when there is no local request in flight.
      committedFiltersRef.current = committedFilters;
    }
    // URL navigation is external state (Back/Forward, pagination, direct links); this is its subscription boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategoryPath(basePath);
    setQuery(initialQuery);
    setBrand(initialBrand);
    setSort(initialSort);
  }, [basePath, brand, categoryPath, initialBrand, initialQuery, initialSort, query, sort]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    const filtersChanged = categoryPath !== basePath
      || normalizedQuery !== initialQuery
      || brand !== initialBrand
      || sort !== initialSort;
    if (!filtersChanged) return;

    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());

      if (normalizedQuery) next.set("q", normalizedQuery);
      else next.delete("q");

      if (brand) next.set("brand", brand);
      else next.delete("brand");

      if (sort === "newest") next.delete("sort");
      else next.set("sort", sort);

      // Зміна фільтрів завжди повертає до першої сторінки.
      next.delete("page");

      const nextSearch = next.toString();
      if (categoryPath === basePath && nextSearch === searchParams.toString()) return;

      requestedFiltersRef.current = filterKey(categoryPath, normalizedQuery, brand, sort);
      startTransition(() => {
        const href = (nextSearch ? `${categoryPath}?${nextSearch}` : categoryPath) as Route;
        router.replace(href, { scroll: false });
      });
    }, FILTER_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [basePath, brand, categoryPath, initialBrand, initialQuery, initialSort, query, router, searchParams, sort]);

  return (
    <div className={styles.catalogLayout}>
      <form
        className={styles.filters}
        id="catalog-filters"
        aria-label="Фільтри каталогу"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className={styles.field}>
          Категорія
          <span className={styles.nativeSelect}>
            <select
              name="category"
              value={categoryPath}
              onChange={(event) => setCategoryPath(event.target.value)}
            >
              <option value="/catalog">Усі категорії</option>
              {categories.map((category) => (
                <option key={category.id} value={category.href}>
                  {`${"\u00a0\u00a0".repeat(category.depth)}${category.depth ? "↳ " : ""}${category.name}`}
                </option>
              ))}
            </select>
            <span aria-hidden="true" />
          </span>
        </label>
        <label>
          Пошук
          <input
            className={styles.input}
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Назва або артикул"
            autoComplete="off"
          />
        </label>
        <CustomSelect
          label="Бренд"
          name="brand"
          value={brand}
          onValueChange={setBrand}
          options={[{ value: "", label: "Усі бренди" }, ...brands.map((name) => ({ value: name, label: name }))]}
        />
        <CustomSelect
          label="Сортування"
          name="sort"
          value={sort}
          onValueChange={setSort}
          options={[
            { value: "newest", label: "Новинки" },
            { value: "price_asc", label: "Ціна: від нижчої" },
            { value: "price_desc", label: "Ціна: від вищої" },
          ]}
        />
      </form>

      <section
        className={styles.catalogResults}
        id="catalog-results"
        aria-label="Товари"
        aria-busy={isPending}
        data-pending={isPending}
      >
        <span className={styles.resultsStatus} role="status" aria-live="polite">
          {isPending ? "Оновлюємо товари…" : ""}
        </span>
        <div className={styles.resultsContent}>{children}</div>
      </section>
    </div>
  );
}
