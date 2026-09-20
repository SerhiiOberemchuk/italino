"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCartStore } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { CrmCapabilityMethod } from "@/lib/crm/types";
import { HUTKO_PAYMENT_KEY } from "@/lib/store";
import styles from "@/app/shop.module.css";

type Props = {
  shipping: CrmCapabilityMethod[];
  payments: CrmCapabilityMethod[];
  minOrderAmount: number | null;
};

type CheckoutResult = { orderId?: string; paymentUrl?: string; error?: string };

export function CheckoutForm({ shipping, payments, minOrderAmount }: Props) {
  const router = useRouter();
  const hydrated = useCartStore((state) => state.hydrated);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const paymentAvailable = payments.some((method) => method.key === HUTKO_PAYMENT_KEY);
  const belowMinimum = minOrderAmount !== null && total < minOrderAmount;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            firstName: values.firstName,
            lastName: values.lastName,
            phone: values.phone,
            email: values.email,
            city: values.city,
          },
          delivery: {
            carrier: values.shipping,
            method: values.shipping === "pickup" ? "pickup" : "branch",
            branch: values.branch,
            comment: values.comment,
          },
          payment: values.payment,
          items: items.map(({ sku, quantity }) => ({ sku, quantity })),
        }),
      });
      const result = await response.json() as CheckoutResult;
      if (!response.ok || !result.orderId) throw new Error(result.error ?? "Не вдалося створити замовлення.");
      clearCart();
      // Платіжне посилання далі бере сторінка замовлення з CRM — на випадок,
      // якщо покупець повернеться до неї з іншого пристрою чи вкладки.
      if (result.paymentUrl) {
        window.location.assign(result.paymentUrl);
        return;
      }
      router.push(`/order/${encodeURIComponent(result.orderId)}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не вдалося створити замовлення.");
      setPending(false);
    }
  }

  if (!hydrated) return <p className={styles.empty}>Завантажуємо кошик…</p>;
  if (!items.length) {
    return <div className={styles.empty}>Кошик порожній. Поверніться до каталогу та додайте товар.</div>;
  }

  return (
    <form className={styles.checkoutLayout} onSubmit={submit}>
      <div className={styles.form}>
        <section className={styles.section}>
          <h2>1. Контакти</h2>
          <div className={styles.fields}>
            <label className={styles.field}>Ім’я
              <input className={styles.input} name="firstName" required maxLength={120} autoComplete="given-name" />
            </label>
            <label className={styles.field}>Прізвище
              <input className={styles.input} name="lastName" required maxLength={120} autoComplete="family-name" />
            </label>
            <label className={styles.field}>Телефон
              <input className={styles.input} name="phone" required maxLength={50} autoComplete="tel" placeholder="+380…" />
            </label>
            <label className={styles.field}>E-mail
              <input className={styles.input} name="email" type="email" required maxLength={255} autoComplete="email" />
            </label>
            <label className={styles.field}>Місто
              <input className={styles.input} name="city" required maxLength={120} autoComplete="address-level2" />
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <h2>2. Доставка</h2>
          <div className={styles.fields}>
            {shipping.map((method, index) => (
              <label className={styles.radio} key={method.key}>
                <input type="radio" name="shipping" value={method.key} defaultChecked={index === 0} required />
                <span>
                  <strong>{method.label}</strong><br />
                  <small>
                    {method.key === "pickup"
                      ? "Самовивіз; деталі узгодить менеджер"
                      : "Доставка за тарифами перевізника"}
                  </small>
                </span>
              </label>
            ))}
          </div>
          <label className={styles.field}>Відділення або адреса
            <input className={styles.input} name="branch" maxLength={200} placeholder="Для самовивозу можна залишити порожнім" />
          </label>
          <label className={styles.field}>Коментар
            <textarea className={styles.textarea} name="comment" maxLength={1000} />
          </label>
        </section>

        <section className={styles.section}>
          <h2>3. Оплата</h2>
          {paymentAvailable ? (
            <label className={styles.radio}>
              <input type="radio" name="payment" value={HUTKO_PAYMENT_KEY} defaultChecked required />
              <span>
                <strong>Онлайн-оплата карткою</strong><br />
                <small>Банківська картка; Apple Pay і Google Pay — якщо вони доступні у платіжній формі</small>
              </span>
            </label>
          ) : (
            <p className={styles.error}>Онлайн-оплата тимчасово недоступна. Спробуйте пізніше.</p>
          )}
        </section>

        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </div>

      <aside className={styles.summary}>
        <h2>Разом</h2>
        {items.map((item) => (
          <div className={styles.summaryRow} key={item.sku}>
            <span>{item.name} × {item.quantity}</span>
            <strong>{formatPrice(item.price * item.quantity, item.currency)}</strong>
          </div>
        ))}
        <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
          <span>До сплати</span><strong>{formatPrice(total, "UAH")}</strong>
        </div>
        {belowMinimum ? (
          <p className={styles.error}>Мінімальна сума — {formatPrice(minOrderAmount ?? 0, "UAH")}</p>
        ) : null}
        <label className={styles.consent}>
          <input type="checkbox" required />
          <span>
            Погоджуюся з <Link href="/legal/offer" target="_blank">публічною офертою</Link> та{" "}
            <Link href="/legal/privacy" target="_blank">політикою конфіденційності</Link>.
          </span>
        </label>
        <button className={styles.primary} disabled={pending || !paymentAvailable || belowMinimum}>
          {pending ? "Створюємо…" : "Перейти до оплати"}
        </button>
        <p className={styles.lineMeta}>Після створення замовлення відкриється захищена платіжна сторінка.</p>
      </aside>
    </form>
  );
}
