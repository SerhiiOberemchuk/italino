import type { Metadata } from "next";
import { CartPage } from "@/components/cart/cart-page";
import { getFreeShippingThreshold } from "@/lib/crm/catalog";
import styles from "../shop.module.css";

export const metadata: Metadata = { title: "Кошик" };

/** Поріг доставки — з кешу CRM, тож сторінка цілком у статичній оболонці. */
export default async function Page() {
  const freeShippingFrom = await getFreeShippingThreshold();
  return (
    <main className={`wrap ${styles.page}`}>
      <div className={styles.hero}>
        <div><p className="eyebrow">Покупки</p><h1>Кошик</h1></div>
      </div>
      <CartPage freeShippingFrom={freeShippingFrom} />
    </main>
  );
}
