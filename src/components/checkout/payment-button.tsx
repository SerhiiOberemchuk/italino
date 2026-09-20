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
  return paymentUrl ? <p><a className={styles.primary} href={paymentUrl} rel="noreferrer">Перейти до оплати</a></p> : null;
}
