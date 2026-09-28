"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { resolveFavoriteProducts } from "./actions";
import { ProductCard } from "@/components/catalog/product-card";
import type { ProductCard as ProductCardModel } from "@/lib/catalog/product-cards";
import { useFavoritesStore } from "@/lib/favorites";
import styles from "../shop.module.css";

export default function FavoritesPage() {
  const hydrated = useFavoritesStore((state) => state.hydrated);
  const favorites = useFavoritesStore((state) => state.items);
  const reconcile = useFavoritesStore((state) => state.reconcile);
  const requestKey = favorites.join("\u0000");
  const [result, setResult] = useState<{ key: string; products: ProductCardModel[] }>({ key: "", products: [] });
  const [error, setError] = useState<{ key: string; message: string }>({ key: "", message: "" });
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    if (!hydrated) return;
    if (!favorites.length) return;

    let ignore = false;
    startTransition(async () => {
      try {
        const current = await resolveFavoriteProducts(favorites);
        if (ignore) return;
        setResult({ key: requestKey, products: current });
        setError({ key: requestKey, message: "" });
        reconcile(current.map((product) => product.id));
      } catch {
        if (!ignore) setError({ key: requestKey, message: "Не вдалося оновити улюблені товари. Спробуйте ще раз." });
      }
    });
    return () => { ignore = true; };
  }, [favorites, hydrated, reconcile, requestKey]);

  const products = result.key === requestKey ? result.products : [];
  const loadError = error.key === requestKey ? error.message : "";
  const visibleProducts = products.filter((product) => favorites.includes(product.id));

  return (
    <main className={`wrap ${styles.page}`}>
      <div className={styles.hero}>
        <div><p className="eyebrow">Добірка</p><h1>Улюблені товари</h1></div>
        <p>Збережіть моделі, щоб повернутися до них пізніше.</p>
      </div>
      {!hydrated || (loading && !products.length && favorites.length > 0) ? (
        <p className={styles.empty}>Завантажуємо добірку…</p>
      ) : loadError ? (
        <p className={styles.error} role="alert">{loadError}</p>
      ) : favorites.length && visibleProducts.length ? (
        <>
          {loading ? <p className={styles.notice} role="status">Оновлюємо добірку…</p> : null}
          <div className={styles.grid}>
            {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
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
