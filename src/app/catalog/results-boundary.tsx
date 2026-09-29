"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { useCatalog } from "./catalog-context";
import styles from "../shop.module.css";

/**
 * Рамка результатів у layout каталогу. Поки перехід, запущений фільтрами чи
 * пагінацією, не отримав відповіді, старі товари притемнюються, а якщо
 * відповідь затримується — на їхньому місці з'являється скелетон (див.
 * `.resultsFrame[data-pending]`). Швидкі відповіді обходяться без скелетона.
 */
export function CatalogResultsFrame({ skeleton, children }: { skeleton: ReactNode; children: ReactNode }) {
  const { isPending } = useCatalog();
  return (
    <div className={styles.resultsFrame} data-pending={isPending || undefined} aria-busy={isPending}>
      <p className="sr-only" role="status">{isPending ? "Оновлюємо товари…" : ""}</p>
      <div className={styles.resultsContent}>{children}</div>
      {isPending ? <div className={styles.resultsPending} aria-hidden="true">{skeleton}</div> : null}
    </div>
  );
}

/**
 * Окрема межа `<Suspense>` на кожну адресу. Без ключа React тримав би старі
 * товари, доки не прийдуть нові; з ключем нова комбінація фільтрів одразу
 * показує скелетон. Ключ рахується на клієнті: під час переходу межа з'являється
 * вже в статичній оболонці, без проміжного фолбека.
 */
export function CatalogResultsBoundary({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  const searchParams = useSearchParams();
  return (
    <Suspense key={searchParams.toString()} fallback={fallback}>
      {children}
    </Suspense>
  );
}
