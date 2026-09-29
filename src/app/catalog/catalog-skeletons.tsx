"use client";

import { ProductCardSkeleton } from "@/components/catalog/product-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { CATALOG_PAGE_SIZE } from "@/lib/catalog/page-size";
import { CatalogHeroFrame } from "./catalog-hero";
import styles from "../shop.module.css";

/*
 * Скелетони каталогу повторюють розмітку й класи справжніх блоків: сталі
 * підписи лишаються текстом, заготовка стоїть лише на місці значень, що
 * вантажаться. Після завантаження нічого не зсувається.
 *
 * Клієнтський модуль навмисно: сервер передає у фолбеки лише посилання на
 * компонент, а не розмітку 24 карток — інакше вона тричі потрапляла б у RSC.
 */

/** Шапка категорії, поки невідома її назва (статична оболонка `/catalog/[category]`). */
export function CatalogHeroSkeleton() {
  return <CatalogHeroFrame eyebrow="Каталог" title={<Skeleton width="5.5em" />} />;
}

const FILTER_FIELDS = [
  { label: "Категорія", width: "58%", select: true },
  { label: "Пошук", width: "64%", select: false },
  { label: "Бренд", width: "46%", select: true },
  { label: "Сортування", width: "42%", select: true },
];

/** Фільтри без значень: підписи й поля на своїх місцях, заготовка — замість вибраного. */
export function CatalogFiltersSkeleton() {
  return (
    <div className={styles.filtersForm} aria-hidden="true">
      {FILTER_FIELDS.map((field) => (
        <div key={field.label} className={styles.field}>
          {field.label}
          <span className={styles.controlSkeleton}>
            <Skeleton width={field.width} />
            {field.select ? <span className={styles.controlChevron} /> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Результати: лічильник без числа й повна сторінка карток-заготовок. */
export function CatalogResultsSkeleton() {
  return (
    <div className={styles.resultsBody}>
      <p className="sr-only" role="status">Завантажуємо товари…</p>
      <p className={styles.resultsCount} aria-hidden="true">
        Знайдено моделей: <Skeleton width="3ch" />
      </p>
      <div className={styles.grid} aria-hidden="true">
        {Array.from({ length: CATALOG_PAGE_SIZE }, (_, index) => <ProductCardSkeleton key={index} />)}
      </div>
    </div>
  );
}
