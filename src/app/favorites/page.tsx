"use client";

import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { useFavoritesStore } from "@/lib/favorites";
import styles from "../shop.module.css";

export default function FavoritesPage() {
  const hydrated = useFavoritesStore((state) => state.hydrated);
  const favorites = useFavoritesStore((state) => state.items);

  return (
    <main className={`wrap ${styles.page}`}>
      <div className={styles.hero}>
        <div><p className="eyebrow">Добірка</p><h1>Улюблені товари</h1></div>
        <p>Збережіть моделі, щоб повернутися до них пізніше.</p>
      </div>
      {!hydrated ? (
        <p className={styles.empty}>Завантажуємо добірку…</p>
      ) : favorites.length ? (
        <div className={styles.grid}>
          {favorites.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
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
