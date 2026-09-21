import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getCapabilities } from "@/lib/crm/catalog";
import { HUTKO_PAYMENT_KEY } from "@/lib/store";
import styles from "../shop.module.css";

export const metadata: Metadata = { title: "Оформлення замовлення" };

async function Content() {
  const capabilities = await getCapabilities();
  const hutko = capabilities.payments.filter((method) => method.key === HUTKO_PAYMENT_KEY && method.paymentLink);
  return (
    <CheckoutForm
      payments={hutko}
      minOrderAmount={capabilities.cart.minOrderAmount}
      freeShippingFrom={capabilities.cart.currency === "UAH" ? capabilities.cart.freeShippingThreshold : null}
    />
  );
}

export default function Page() {
  return (
    <main className={`wrap ${styles.page}`}>
      <div className={styles.hero}>
        <div><p className="eyebrow">Останній крок</p><h1>Оформлення замовлення</h1></div>
      </div>
      <Suspense fallback={<p className={styles.empty}>Завантажуємо способи доставки та оплати…</p>}>
        <Content />
      </Suspense>
    </main>
  );
}
