import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogContent } from "./catalog-content";
import styles from "../shop.module.css";

export const metadata: Metadata = { title: "Каталог", description: "Товари зі складу ITALINO" };

export default function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <main className={`wrap ${styles.page}`}>
      <div className={styles.hero}>
        <div><p className="eyebrow">ITALINO</p><h1>Каталог</h1></div>
        <p>Актуальні товари, ціни й наявність безпосередньо зі складу ITALINO.</p>
      </div>
      <Suspense fallback={<p className={styles.empty}>Завантажуємо каталог…</p>}>
        <CatalogContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
