"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NovaPoshtaFields } from "@/components/checkout/nova-poshta-fields";
import { NextDispatchDate } from "@/components/home/dispatch-clock";
import { CardMarks } from "@/components/ui/payment-marks";
import { useCartStore } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { CrmCapabilityMethod } from "@/lib/crm/types";
import { SHIPPING_METHODS } from "@/lib/shipping/methods";
import { SCHEDULE_COPY } from "@/lib/shipping/schedule";
import { ROZETKAPAY_PAYMENT_KEY } from "@/lib/store";
import { amountToFreeShipping, qualifiesForFreeShipping } from "@/lib/shipping/free-shipping";
import { trackEvent } from "@/lib/analytics";
import styles from "@/app/shop.module.css";

type Props = {
  payments: CrmCapabilityMethod[];
  minOrderAmount: number | null;
  /** Поріг безкоштовної доставки з CRM; `null` — не задано. */
  freeShippingFrom: number | null;
};

type CheckoutResult = { orderId?: string; paymentUrl?: string; error?: string };

export function CheckoutForm({ payments, minOrderAmount, freeShippingFrom }: Props) {
  const router = useRouter();
  const hydrated = useCartStore((state) => state.hydrated);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const selected = SHIPPING_METHODS[0];
  const freeShipping = qualifiesForFreeShipping(total, freeShippingFrom);
  const paymentAvailable = payments.some((method) => method.key === ROZETKAPAY_PAYMENT_KEY);
  const belowMinimum = minOrderAmount !== null && total < minOrderAmount;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    trackEvent("checkout_submit");
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
            branch: values.branch,
            cityRef: values.cityRef,
            branchRef: values.branchRef,
            comment: values.comment,
          },
          payment: values.payment,
          items: items.map(({ sku, quantity }) => ({ sku, quantity })),
        }),
      });
      const result = await response.json() as CheckoutResult;
      if (!response.ok || !result.orderId) throw new Error(result.error ?? "Не вдалося створити замовлення.");
      trackEvent("order_created", { currency: "UAH", value: total });
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
    // Ім’я, телефон, e-mail і відділення не мають потрапляти в записи Clarity.
    <form className={styles.checkoutLayout} onSubmit={submit} data-clarity-mask="True">
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
          </div>
        </section>

        <section className={styles.section}>
          <h2>2. Доставка</h2>
          <div className={styles.fields}>
            {SHIPPING_METHODS.length > 1 ? (
              SHIPPING_METHODS.map((method, index) => (
                <label className={styles.radio} key={method.key}>
                  <input type="radio" name="shipping" value={method.key} defaultChecked={index === 0} required />
                  <span><strong>{method.label}</strong><br /><small>{method.hint}</small></span>
                </label>
              ))
            ) : (
              /* Єдиний перевізник — радіокнопка без вибору лише плутала б. */
              <div className={styles.radio}>
                <input type="hidden" name="shipping" value={selected.key} />
                <span><strong>{selected.label}</strong><br /><small>{selected.hint}</small></span>
              </div>
            )}
          </div>
          <NovaPoshtaFields />
          <label className={styles.field}>Коментар
            <textarea className={styles.textarea} name="comment" maxLength={1000} />
          </label>
        </section>

        <section className={styles.section}>
          <h2>3. Оплата</h2>
          {paymentAvailable ? (
            <>
              <label className={styles.radio}>
                <input type="radio" name="payment" value={ROZETKAPAY_PAYMENT_KEY} defaultChecked required />
                <span>
                  <strong>Онлайн-оплата карткою</strong><br />
                  <small>Visa, Mastercard, ПРОСТІР; Apple Pay і Google Pay — якщо доступні на платіжній сторінці RozetkaPay</small>
                </span>
              </label>
              <CardMarks />
            </>
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
        <div className={styles.summaryRow}>
          <span>Доставка Новою Поштою</span>
          {freeShipping ? <strong>безкоштовно</strong> : <span>при отриманні</span>}
        </div>
        {freeShippingFrom !== null && !freeShipping ? (
          <p className={styles.lineMeta}>
            Ще {formatPrice(amountToFreeShipping(total, freeShippingFrom), "UAH")} — і доставка буде безкоштовною.
          </p>
        ) : null}
        <div className={styles.summaryRow}>
          <span>Відправка з Мілана</span>
          <strong><NextDispatchDate fallback={SCHEDULE_COPY.dispatchOn} /></strong>
        </div>
        <p className={styles.lineMeta}>
          Отримання Новою Поштою — {SCHEDULE_COPY.transit} після відправки, зазвичай {SCHEDULE_COPY.arrivalOn}.
        </p>
        <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
          <span>До сплати</span><strong>{formatPrice(total, "UAH")}</strong>
        </div>
        {belowMinimum ? (
          <p className={styles.error}>Мінімальна сума — {formatPrice(minOrderAmount ?? 0, "UAH")}</p>
        ) : null}
        <p className={styles.terms}>
          Повна сума списується з картки одразу під час оплати. Оплачене замовлення можна скасувати до відправки
          з Мілана, а товар — повернути протягом 14 днів після отримання.{" "}
          <Link href="/legal/payment" target="_blank">Умови оплати</Link> ·{" "}
          <Link href="/returns" target="_blank">Обмін і повернення</Link>
        </p>
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
        <p className={styles.lineMeta}>Після створення замовлення відкриється захищена платіжна сторінка RozetkaPay.</p>
      </aside>
    </form>
  );
}
