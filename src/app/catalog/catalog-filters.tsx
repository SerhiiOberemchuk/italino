"use client";

import type { Route } from "next";
import { use, useEffect, useState } from "react";
import { CustomSelect } from "@/components/ui/custom-select";
import { categoryByPath } from "@/lib/catalog/categories";
import { useCatalog, useCatalogLocation } from "./catalog-context";
import styles from "../shop.module.css";

/** Пауза після останньої літери, перш ніж пошук піде на сервер. */
const QUERY_DELAY_MS = 300;

type SortValue = "newest" | "price_asc" | "price_desc";

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "newest", label: "Новинки" },
  { value: "price_asc", label: "Ціна: від нижчої" },
  { value: "price_desc", label: "Ціна: від вищої" },
];

function sortValue(value: string | null): SortValue {
  return value === "price_asc" || value === "price_desc" ? value : "newest";
}

type FilterChange = { path?: string; q?: string; brand?: string; sort?: SortValue };

/** Адреса з новими фільтрами. Решта параметрів (`discounted`, utm_*) лишається. */
function filterHref(path: string, search: string, change: FilterChange): Route {
  const next = new URLSearchParams(search);

  if (change.q !== undefined) {
    const q = change.q.trim();
    if (q) next.set("q", q);
    else next.delete("q");
  }
  if (change.brand !== undefined) {
    if (change.brand) next.set("brand", change.brand);
    else next.delete("brand");
  }
  if (change.sort !== undefined) {
    if (change.sort === "newest") next.delete("sort");
    else next.set("sort", change.sort);
  }
  // Зміна фільтрів завжди повертає до першої сторінки.
  next.delete("page");

  const target = change.path ?? path;
  const query = next.toString();
  return (query ? `${target}?${query}` : target) as Route;
}

/**
 * Фільтри каталогу. Живуть у layout, тож під час завантаження товарів не
 * зникають і не перемонтовуються. Значення беруться з адреси (з урахуванням
 * переходу, що триває), тому вибраний бренд чи категорія видно одразу.
 */
export function CatalogFilters() {
  const { categories: categoriesPromise, brands: brandsPromise, navigate } = useCatalog();
  const categories = use(categoriesPromise);
  const brands = use(brandsPromise);
  const { path, search } = useCatalogLocation();
  const searchString = search.toString();

  const categoryPath = categoryByPath(categories, path)?.href ?? "/catalog";
  const brand = search.get("brand") ?? "";
  const sort = sortValue(search.get("sort"));
  const urlQuery = (search.get("q") ?? "").trim();

  // Текст, який зараз набирають; `null` — поле показує запит з адреси.
  const [draft, setDraft] = useState<string | null>(null);
  const [seenQuery, setSeenQuery] = useState(urlQuery);
  if (seenQuery !== urlQuery) {
    setSeenQuery(urlQuery);
    // Адреса змінилась ззовні (Назад/Вперед, посилання) — поле бере запит з неї.
    // Власний перехід сюди не потрапляє: оптимістична адреса вже містить набраний текст.
    if (draft !== null && draft.trim() !== urlQuery) setDraft(null);
  }
  const query = draft ?? urlQuery;

  useEffect(() => {
    if (draft === null || draft.trim() === urlQuery) return;
    const timeout = window.setTimeout(() => navigate(filterHref(path, searchString, { q: draft })), QUERY_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [draft, navigate, path, searchString, urlQuery]);

  // Селекти застосовуються одразу й забирають із собою набраний текст пошуку.
  function apply(change: FilterChange) {
    navigate(filterHref(path, searchString, { q: query, ...change }));
  }

  return (
    <form
      className={styles.filtersForm}
      aria-label="Фільтри каталогу"
      onSubmit={(event) => {
        event.preventDefault();
        apply({});
      }}
    >
      <label className={styles.field}>
        Категорія
        <span className={styles.nativeSelect}>
          <select name="category" value={categoryPath} onChange={(event) => apply({ path: event.target.value })}>
            <option value="/catalog">Усі категорії</option>
            {categories.map((category) => (
              <option key={category.id} value={category.href}>
                {`${"  ".repeat(category.depth)}${category.depth ? "↳ " : ""}${category.name}`}
              </option>
            ))}
          </select>
          <span aria-hidden="true" />
        </span>
      </label>
      <label className={styles.field}>
        Пошук
        <input
          className={styles.input}
          type="search"
          name="q"
          value={query}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Назва або артикул"
          autoComplete="off"
          enterKeyHint="search"
        />
      </label>
      <CustomSelect
        label="Бренд"
        name="brand"
        value={brand}
        onValueChange={(value) => apply({ brand: value })}
        options={[{ value: "", label: "Усі бренди" }, ...brands.map((name) => ({ value: name, label: name }))]}
      />
      <CustomSelect
        label="Сортування"
        name="sort"
        value={sort}
        onValueChange={(value) => apply({ sort: value })}
        options={SORT_OPTIONS}
      />
    </form>
  );
}
