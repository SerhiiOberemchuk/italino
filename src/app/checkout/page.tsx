import type { Metadata } from "next";
import { connection } from "next/server";
import { CheckoutForm, type CheckoutCapabilities } from "@/components/checkout/checkout-form";
import { getCapabilities } from "@/lib/crm/catalog";
import { ROZETKAPAY_PAYMENT_KEY } from "@/lib/store";
import styles from "../shop.module.css";

export const metadata: Metadata = { title: "Оформлення замовлення" };

async function loadCapabilities(): Promise<CheckoutCapabilities> {
  // Способи оплати й мінімальна сума — на момент запиту, а не зі статичної оболонки.
  await connection();
  const capabilities = await getCapabilities();
  return {
    payments: capabilities.payments.filter((method) => method.key === ROZETKAPAY_PAYMENT_KEY && method.paymentLink),
    minOrderAmount: capabilities.cart.minOrderAmount,
    freeShippingFrom: capabilities.cart.currency === "UAH" ? capabilities.cart.freeShippingThreshold : null,
  };
}

/** Форма віддається одразу; блоки, що залежать від CRM, чекають на проміс у власних `<Suspense>`. */
export default function Page() {
  return (
    <main className={`wrap ${styles.page}`}>
      <div className={styles.hero}>
        <div><p className="eyebrow">Останній крок</p><h1>Оформлення замовлення</h1></div>
      </div>
      <CheckoutForm capabilities={loadCapabilities()} />
    </main>
  );
}
