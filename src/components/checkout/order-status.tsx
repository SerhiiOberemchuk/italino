"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { StoreOrderStatus } from "@/lib/crm/orders";
import { STORE } from "@/lib/store";
import styles from "./order-status.module.css";

type Props = { initialOrder: StoreOrderStatus; freeShipping: boolean };

const orderCopy = {
  pending: { label: "Замовлення прийнято", text: "Ми отримали ваше замовлення. Після оплати воно потрапить у роботу." },
  confirmed: { label: "Замовлення підтверджено", text: "Оплату отримано, замовлення підтверджено та додано до найближчої поставки." },
  processing: { label: "Комплектуємо замовлення", text: "Готуємо товари на складі в Італії." },
  shipped: { label: "Замовлення відправлено", text: "Замовлення вже в дорозі. Дані відправлення з’являться після передачі перевізнику." },
  delivered: { label: "Замовлення отримано", text: "Дякуємо за покупку в Italino." },
  cancelled: { label: "Замовлення скасовано", text: "Якщо це сталося помилково, зв’яжіться з нами." },
  refunded: { label: "Кошти повернено", text: "Повернення погоджено. Строк зарахування залежить від вашого банку." },
} as const;

const paymentCopy = {
  pending: "Очікуємо оплату",
  paid: "Оплату отримано",
  failed: "Оплату не завершено",
  refunded: "Кошти повернено",
} as const;

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function OrderStatus({ initialOrder, freeShipping }: Props) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(order.orderId)}`, { cache: "no-store" });
      const result = await response.json() as StoreOrderStatus & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Не вдалося оновити стан замовлення.");
      setOrder(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не вдалося оновити стан замовлення.");
    } finally {
      setLoading(false);
    }
  }, [order.orderId]);

  useEffect(() => {
    if (["cancelled", "refunded", "delivered"].includes(order.orderStatus)) return;
    const interval = order.paymentStatus === "pending" ? 15_000 : 60_000;
    const timer = window.setInterval(() => { void refresh(); }, interval);
    return () => window.clearInterval(timer);
  }, [order.orderStatus, order.paymentStatus, refresh]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setError("Не вдалося скопіювати посилання. Збережіть адресу цієї сторінки.");
    }
  }

  async function pay() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(order.orderId)}/payment-link`, { method: "POST" });
      const result = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error ?? "Не вдалося підготувати оплату.");
      window.location.assign(result.checkoutUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не вдалося підготувати оплату.");
      setLoading(false);
    }
  }

  const paid = order.paymentStatus === "paid";
  const canPay = !paid && !["cancelled", "refunded"].includes(order.orderStatus);
  // «До сплати» під сумою вже оплаченого замовлення читається як новий рахунок.
  const amountLabel = paid ? "Оплачено"
    : order.paymentStatus === "refunded" ? "Сума замовлення"
      : "До сплати";
  const status = orderCopy[order.orderStatus];
  return (
    <div className={styles.card} data-clarity-mask="True">
      <div className={styles.topline}>
        <p className="eyebrow">Статус замовлення</p>
        <button className={`${styles.refresh} ${styles.noPrint}`} type="button" onClick={() => void refresh()} disabled={loading}>{loading ? "Оновлюємо…" : "Оновити"}</button>
      </div>
      <h1>{status.label}</h1>
      <p className={styles.lead}>{status.text}</p>
      <div className={styles.payment} data-status={order.paymentStatus}>
        <span>Оплата</span>
        <strong>{paymentCopy[order.paymentStatus]}</strong>
      </div>
      <dl className={styles.details}>
        <div><dt>Номер замовлення</dt><dd>{order.number ?? order.orderId}</dd></div>
        <div><dt>Створено</dt><dd>{formatDate(order.createdAt)}</dd></div>
      </dl>
      {/* Після оплати блок працює як квитанція: її можна надрукувати або зберегти в PDF засобами браузера. */}
      <section className={styles.receipt} aria-labelledby="receipt-title">
        <div className={styles.receiptHead}>
          <h2 id="receipt-title">{paid ? "Квитанція про оплату" : "Склад замовлення"}</h2>
          {paid ? (
            <button className={`${styles.print} ${styles.noPrint}`} type="button" onClick={() => window.print()}>
              Зберегти PDF / Надрукувати
            </button>
          ) : null}
        </div>
        {order.items.length ? (
          <table className={styles.items}>
            <thead>
              <tr><th scope="col">Товар</th><th scope="col">Кількість і ціна</th><th scope="col">Сума</th></tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={`${item.sku ?? item.name}-${index}`}>
                  <td>{item.name}{item.sku ? <small>Артикул {item.sku}</small> : null}</td>
                  <td>{item.quantity} × {formatPrice(item.unitPrice, order.currency)}</td>
                  <td>{formatPrice(item.total, order.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        <dl className={styles.details}>
          <div><dt>Доставка Новою Поштою</dt><dd>{freeShipping ? "Безкоштовно" : "За тарифами перевізника, при отриманні"}</dd></div>
          <div><dt>{amountLabel}</dt><dd>{formatPrice(Number(order.totalAmount), order.currency)}</dd></div>
          {paid ? (
            <>
              <div><dt>Дата оплати</dt><dd>{order.paidAt ? formatDate(order.paidAt) : "—"}</dd></div>
              <div><dt>Спосіб оплати</dt><dd>Онлайн-оплата карткою, RozetkaPay</dd></div>
              <div><dt>Продавець</dt><dd>{STORE.legalName}, РНОКПП {STORE.taxId}</dd></div>
            </>
          ) : null}
        </dl>
      </section>
      <div className={`${styles.share} ${styles.noPrint}`}>
        <span>Збережіть це посилання, щоб повернутися до статусу замовлення.</span>
        <button type="button" onClick={() => void copyLink()}>{copied ? "Скопійовано" : "Скопіювати посилання"}</button>
      </div>
      {canPay ? <button className={`btn btn--primary ${styles.noPrint}`} type="button" onClick={() => void pay()} disabled={loading}>{order.paymentStatus === "failed" ? "Спробувати оплатити ще раз" : "Перейти до оплати"}</button> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {order.paymentStatus === "pending" ? <p className={`${styles.note} ${styles.noPrint}`}>Після оплати сторінка оновиться автоматично. Не створюйте нове замовлення.</p> : null}
      <p className={`${styles.contact} ${styles.noPrint}`}>Потрібна допомога? <Link href="/contacts"><u>Зв’яжіться з нами</u></Link>.</p>
    </div>
  );
}
