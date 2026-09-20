"use client";

import { useSyncExternalStore } from "react";
import styles from "@/app/shop.module.css";

function subscribe() { return () => {}; }
function serverSnapshot() { return null; }

export function PaymentButton({ orderId }: { orderId: string }) {
  const paymentUrl = useSyncExternalStore(
    subscribe,
    () => {
      const value = sessionStorage.getItem(`italino-payment-${orderId}`);
      return value && /^https:\/\//.test(value) ? value : null;
    },
    serverSnapshot,
  );
  const paymentPending = useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(`italino-payment-pending-${orderId}`) === "1",
    () => false,
  );
  if (paymentUrl) return <p><a className={styles.primary} href={paymentUrl} rel="noreferrer">Оплатити через Hutko</a></p>;
  if (paymentPending) return <p className={styles.error}>Замовлення створено, але платіжне посилання поки недоступне. Ми зв’яжемося з вами та надішлемо нове посилання.</p>;
  return null;
}
