"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { FAVORITES_EVENT, FAVORITES_STORAGE_KEY, readFavorites } from "@/lib/favorites";
import styles from "../shop.module.css";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(FAVORITES_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(FAVORITES_EVENT, callback);
  };
}

function snapshot() {
  return localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]";
}

export default function FavoritesPage() {
  useSyncExternalStore(subscribe, snapshot, () => "[]");
  const favorites = readFavorites();
  return <main className={`wrap ${styles.page}`}>
    <div className={styles.hero}><div><p className="eyebrow">Добірка</p><h1>Улюблені товари</h1></div><p>Збережіть моделі, щоб повернутися до них пізніше.</p></div>
    {favorites.length ? <div className={styles.grid}>{favorites.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className={styles.success}><h2>Улюблених товарів поки немає</h2><p>Натискайте на сердечко в каталозі, щоб зберегти товар у цій добірці.</p><Link className={styles.primary} href="/catalog">Перейти до каталогу</Link></div>}
  </main>;
}
