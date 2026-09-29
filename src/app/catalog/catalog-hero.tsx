"use client";

import type { Route } from "next";
import { use, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryByPath } from "@/lib/catalog/categories";
import { CatalogLink, useCatalog, useCatalogLocation, useCatalogPath } from "./catalog-context";
import styles from "../shop.module.css";

const LEAD = "Актуальні товари, ціни й наявність безпосередньо зі складу ITALINO.";

/**
 * Розмітка шапки каталогу — спільна для самої шапки та її скелетона. Опис має
 * власну колонку, тож довга назва категорії не зсуває фільтри й товари нижче.
 */
export function CatalogHeroFrame({ eyebrow, title }: { eyebrow: ReactNode; title: ReactNode }) {
  return (
    <div className={`${styles.hero} ${styles.catalogHero}`}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <p>{LEAD}</p>
    </div>
  );
}

/**
 * Заголовок каталогу або категорії. Назву бере з уже завантаженого дерева
 * категорій, тож під час переходу між категоріями вона змінюється одразу, без
 * запиту. Для `/catalog` дерево не потрібне — шапка лишається статичною.
 */
export function CatalogHero() {
  const { categories } = useCatalog();
  const path = useCatalogPath();
  if (path === "/catalog") return <CatalogHeroFrame eyebrow="ITALINO" title="Каталог" />;

  const links = use(categories);
  const category = categoryByPath(links, path);
  const parent = category?.parentId ? links.find((link) => link.id === category.parentId) : undefined;

  return (
    <CatalogHeroFrame
      eyebrow={(
        <>
          <CatalogLink className={styles.heroCrumb} href="/catalog">Каталог</CatalogLink>
          {parent ? (
            <>
              <span aria-hidden="true">/</span>
              <CatalogLink className={styles.heroCrumb} href={parent.href}>{parent.name}</CatalogLink>
            </>
          ) : null}
        </>
      )}
      // Невідома категорія: сторінка віддасть 404, до того — заготовка замість назви.
      title={category ? category.name : <Skeleton width="5.5em" />}
    />
  );
}

/** Підкатегорії поточної категорії. Фільтри (пошук, бренд, сортування) зберігаються. */
export function CatalogSubcategories() {
  const { categories } = useCatalog();
  const { path, search } = useCatalogLocation();
  if (path === "/catalog") return null;

  const links = use(categories);
  const category = categoryByPath(links, path);
  const children = category ? links.filter((link) => link.parentId === category.id) : [];
  if (!children.length) return null;

  search.delete("page");
  const query = search.toString();

  return (
    <nav className={styles.subcategories} aria-label="Підкатегорії">
      {children.map((item) => (
        <CatalogLink
          key={item.id}
          className={styles.pagerLink}
          href={(query ? `${item.href}?${query}` : item.href) as Route}
        >
          {item.name}
        </CatalogLink>
      ))}
    </nav>
  );
}
