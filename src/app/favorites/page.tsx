"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { resolveFavoriteProducts } from "./actions";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductCardSkeleton } from "@/components/catalog/product-card-skeleton";
import type { ProductCard as ProductCardModel } from "@/lib/catalog/product-cards";
import { useFavoritesStore } from "@/lib/favorites";
import { FAVORITES_PAGE_SIZE } from "@/lib/favorites-page";
import styles from "../shop.module.css";

export default function FavoritesPage() {
  const hydrated = useFavoritesStore((state) => state.hydrated);
  const favorites = useFavoritesStore((state) => state.items);
  const forget = useFavoritesStore((state) => state.forget);
  const [requestedPage, setRequestedPage] = useState(1);
  // Завантажуємо лише поточну сторінку добірки, а не всі збережені моделі.
  const pageCount = Math.max(1, Math.ceil(favorites.length / FAVORITES_PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const requestKey = favorites.slice((page - 1) * FAVORITES_PAGE_SIZE, page * FAVORITES_PAGE_SIZE).join("\u0000");
  const [result, setResult] = useState<{ key: string; products: ProductCardModel[] }>({ key: "", products: [] });
  const [error, setError] = useState<{ key: string; message: string }>({ key: "", message: "" });
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    if (!hydrated) return;
    if (!requestKey) return;

    const ids = requestKey.split("\u0000");
    let ignore = false;
    startTransition(async () => {
      try {
        const current = await resolveFavoriteProducts(ids);
        if (ignore) return;
        setResult({ key: requestKey, products: current });
        setError({ key: requestKey, message: "" });
        const found = new Set(current.map((product) => product.id));
        const missing = ids.filter((id) => !found.has(id));
        if (missing.length) forget(missing);
      } catch {
        if (!ignore) setError({ key: requestKey, message: "Не вдалося оновити улюблені товари. Спробуйте ще раз." });
      }
    });
    return () => { ignore = true; };
  }, [forget, hydrated, requestKey]);

  const products = result.key === requestKey ? result.products : [];
  const loadError = error.key === requestKey ? error.message : "";
  // Поточна сторінка ще не прийшла (зокрема кадр між гідрацією й запитом) — заготовки,
  // а не порожній стан. До гідрації кількість невідома: один ряд.
  const waiting = !hydrated || (favorites.length > 0 && result.key !== requestKey && !loadError);
  const skeletonCount = hydrated ? requestKey.split("\u0000").length : 3;
  const visibleProducts = products.filter((product) => favorites.includes(product.id));
  const goTo = (next: number) => {
    setRequestedPage(next);
    window.scrollTo({ top: 0 });
  };

  return (
    <main className={`wrap ${styles.page}`}>
      <div className={styles.hero}>
        <div><p className="eyebrow">Добірка</p><h1>Улюблені товари</h1></div>
        <p>Збережіть моделі, щоб повернутися до них пізніше.</p>
      </div>
      {waiting ? (
        <>
          <p className="sr-only" role="status">Завантажуємо добірку…</p>
          <div className={styles.grid} aria-hidden="true">
            {Array.from({ length: skeletonCount }, (_, index) => <ProductCardSkeleton key={index} />)}
          </div>
        </>
      ) : loadError ? (
        <p className={styles.error} role="alert">{loadError}</p>
      ) : favorites.length && visibleProducts.length ? (
        <>
          <p className="sr-only" role="status">{loading ? "Оновлюємо добірку…" : ""}</p>
          <div className={styles.grid}>
            {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
          {pageCount > 1 ? (
            <nav className={styles.pager} aria-label="Сторінки добірки">
              <button
                type="button"
                className={`${styles.pagerLink} ${page > 1 ? "" : styles.pagerMuted}`}
                disabled={page <= 1}
                onClick={() => goTo(page - 1)}
              >
                ← Назад
              </button>
              <span className={styles.pagerInfo}>{page} / {pageCount}</span>
              <button
                type="button"
                className={`${styles.pagerLink} ${page < pageCount ? "" : styles.pagerMuted}`}
                disabled={page >= pageCount}
                onClick={() => goTo(page + 1)}
              >
                Далі →
              </button>
            </nav>
          ) : null}
        </>
      ) : (
        <div className={styles.success}>
          <h2>Улюблених товарів поки немає</h2>
          <p>Натискайте на сердечко в каталозі, щоб зберегти товар у цій добірці.</p>
          <Link className={styles.primary} href="/catalog">Перейти до каталогу</Link>
        </div>
      )}
    </main>
  );
}
