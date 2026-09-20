"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { CART_EVENT, CART_STORAGE_KEY, readCart, writeCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { CrmCapabilityMethod } from "@/lib/crm/types";
import styles from "@/app/shop.module.css";

type Props = { shipping: CrmCapabilityMethod[]; payments: CrmCapabilityMethod[]; minOrderAmount: number | null };
function subscribe(callback: () => void) { window.addEventListener("storage", callback); window.addEventListener(CART_EVENT, callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener(CART_EVENT, callback); }; }
function snapshot() { return localStorage.getItem(CART_STORAGE_KEY) ?? "[]"; }
function serverSnapshot() { return "[]"; }

export function CheckoutForm({ shipping, payments, minOrderAmount }: Props) {
  const router = useRouter();
  useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const items = readCart();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!items.length) return <div className={styles.empty}>Кошик порожній. Поверніться до каталогу та додайте товар.</div>;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer: { firstName: values.firstName, lastName: values.lastName, phone: values.phone, email: values.email, city: values.city }, delivery: { carrier: values.shipping, method: values.shipping === "pickup" ? "pickup" : "branch", branch: values.branch, comment: values.comment }, payment: values.payment, items: items.map(({ sku, quantity }) => ({ sku, quantity })) }) });
      const result = await response.json() as { orderId?: string; paymentUrl?: string; error?: string };
      if (!response.ok || !result.orderId) throw new Error(result.error ?? "Не вдалося створити замовлення.");
      writeCart([]);
      if (result.paymentUrl) sessionStorage.setItem(`italino-payment-${result.orderId}`, result.paymentUrl);
      router.push(`/checkout/success/${encodeURIComponent(result.orderId)}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Не вдалося створити замовлення."); setPending(false); }
  }
  return <form className={styles.checkoutLayout} onSubmit={submit}><div className={styles.form}><section className={styles.section}><h2>1. Контакти</h2><div className={styles.fields}><label className={styles.field}>Ім’я<input className={styles.input} name="firstName" required maxLength={120} autoComplete="given-name" /></label><label className={styles.field}>Прізвище<input className={styles.input} name="lastName" required maxLength={120} autoComplete="family-name" /></label><label className={styles.field}>Телефон<input className={styles.input} name="phone" required maxLength={50} autoComplete="tel" placeholder="+380…" /></label><label className={styles.field}>E-mail<input className={styles.input} name="email" type="email" required maxLength={255} autoComplete="email" /></label><label className={styles.field}>Місто<input className={styles.input} name="city" required maxLength={120} autoComplete="address-level2" /></label></div></section><section className={styles.section}><h2>2. Доставка</h2><div className={styles.fields}>{shipping.map((method, index) => <label className={styles.radio} key={method.key}><input type="radio" name="shipping" value={method.key} defaultChecked={index === 0} required /><span><strong>{method.label}</strong><br /><small>{method.key === "pickup" ? "Самовивіз; деталі узгодить менеджер" : "Доставка за тарифами перевізника"}</small></span></label>)}</div><label className={styles.field}>Відділення або адреса<input className={styles.input} name="branch" maxLength={200} placeholder="Для самовивозу можна залишити порожнім" /></label><label className={styles.field}>Коментар<textarea className={styles.textarea} name="comment" maxLength={1000} /></label></section><section className={styles.section}><h2>3. Оплата</h2><div className={styles.fields}>{payments.map((method, index) => <label className={styles.radio} key={method.key}><input type="radio" name="payment" value={method.key} defaultChecked={index === 0} required /><span><strong>{method.label}</strong>{method.paymentLink ? <><br /><small>Після оформлення відкриється безпечна сторінка оплати</small></> : null}</span></label>)}</div></section>{error ? <p className={styles.error} role="alert">{error}</p> : null}</div><aside className={styles.summary}><h2>Разом</h2>{items.map((item) => <div className={styles.summaryRow} key={item.sku}><span>{item.name} × {item.quantity}</span><strong>{formatPrice(item.price * item.quantity, item.currency)}</strong></div>)}<div className={`${styles.summaryRow} ${styles.summaryTotal}`}><span>До сплати</span><strong>{formatPrice(total, "UAH")}</strong></div>{minOrderAmount !== null && total < minOrderAmount ? <p className={styles.error}>Мінімальна сума — {formatPrice(minOrderAmount, "UAH")}</p> : null}<button className={styles.primary} disabled={pending || (minOrderAmount !== null && total < minOrderAmount)}>{pending ? "Створюємо…" : "Підтвердити замовлення"}</button><p className={styles.lineMeta}>Натискаючи кнопку, ви погоджуєтеся з умовами оферти та обробкою даних.</p></aside></form>;
}
