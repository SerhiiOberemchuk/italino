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
  const committedFiltersRef = useRef(`${basePath}\u0000${initialQuery}\u0000${initialBrand}\u0000${initialSort}`);

  // Cache Components зберігають цей клієнтський shell між навігаціями.
  // Синхронізація потрібна для переходів Back/Forward і посилань пагінації.
  useEffect(() => {
    const committedFilters = `${basePath}\u0000${initialQuery}\u0000${initialBrand}\u0000${initialSort}`;
    if (committedFiltersRef.current === committedFilters) return;

    committedFiltersRef.current = committedFilters;
    setCategoryPath(basePath);
    setQuery(initialQuery);
    setBrand(initialBrand);
    setSort(initialSort);
  }, [basePath, initialBrand, initialQuery, initialSort]);

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
