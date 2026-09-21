import type { Metadata } from "next";
import { Suspense } from "react";
import { CartPage } from "@/components/cart/cart-page";
import { getFreeShippingThreshold } from "@/lib/crm/catalog";
import styles from "../shop.module.css";

export const metadata: Metadata = { title: "Кошик" };

async function Content() {
  return <CartPage freeShippingFrom={await getFreeShippingThreshold()} />;
}

export default function Page() {
  return (
    <main className={`wrap ${styles.page}`}>
      <div className={styles.hero}>
        <div><p className="eyebrow">Покупки</p><h1>Кошик</h1></div>
      </div>
      <Suspense fallback={<p className={styles.empty}>Завантажуємо кошик…</p>}>
        <Content />
      </Suspense>
    </main>
  );
}
