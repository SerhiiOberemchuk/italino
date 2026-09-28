"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { submitCheckout, type CheckoutActionState } from "@/app/checkout/actions";
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

const INITIAL_CHECKOUT_STATE: CheckoutActionState = { status: "idle" };
const CHECKOUT_ATTEMPT_KEY = "italino-checkout-attempt-v1";

function cartFingerprint(items: ReturnType<typeof useCartStore.getState>["items"]): string {
  return JSON.stringify(items.map(({ sku, quantity, price, currency }) => ({ sku, quantity, price, currency })));
}

function checkoutAttempt(fingerprint: string): string {
  try {
    const stored = JSON.parse(sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY) ?? "null") as {
      id?: unknown;
      fingerprint?: unknown;
    } | null;
    const id = stored?.fingerprint === fingerprint && typeof stored.id === "string"
      ? stored.id
      : crypto.randomUUID();
    sessionStorage.setItem(CHECKOUT_ATTEMPT_KEY, JSON.stringify({ id, fingerprint }));
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function CheckoutForm({ payments, minOrderAmount, freeShippingFrom }: Props) {
  const router = useRouter();
  const hydrated = useCartStore((state) => state.hydrated);
  const items = useCartStore((state) => state.items);
  const setItems = useCartStore((state) => state.setItems);
  const clearCart = useCartStore((state) => state.clear);
  const [state, formAction, pending] = useActionState(submitCheckout, INITIAL_CHECKOUT_STATE);
  const handledOrder = useRef<string | null>(null);
  const attemptInput = useRef<HTMLInputElement>(null);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const selected = SHIPPING_METHODS[0];
  const freeShipping = qualifiesForFreeShipping(total, freeShippingFrom);
  const paymentAvailable = payments.some((method) => method.key === ROZETKAPAY_PAYMENT_KEY);
  const belowMinimum = minOrderAmount !== null && total < minOrderAmount;

  useEffect(() => {
    if (!hydrated || !items.length) return;
    if (attemptInput.current) attemptInput.current.value = checkoutAttempt(cartFingerprint(items));
  }, [hydrated, items]);

  useEffect(() => {
    if (state.status === "cart_changed" && state.items) {
      setItems(state.items);
      return;
    }
    if (state.status !== "success" || !state.orderId || handledOrder.current === state.orderId) return;

    handledOrder.current = state.orderId;
    trackEvent("order_created", { currency: "UAH", value: state.total ?? total });
    try {
      sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
    } catch {
      // Замовлення вже створене; недоступне сховище не повинно блокувати перехід.
    }
    clearCart();
    if (state.paymentUrl) {
      window.location.assign(state.paymentUrl);
      return;
    }
    router.push(`/order/${encodeURIComponent(state.orderId)}`);
  }, [clearCart, router, setItems, state, total]);

  if (!hydrated) return <p className={styles.empty}>Завантажуємо кошик…</p>;
  if (!items.length) {
    return <div className={styles.empty}>Кошик порожній. Поверніться до каталогу та додайте товар.</div>;
  }

  return (
    // Ім’я, телефон, e-mail і відділення не мають потрапляти в записи Clarity.
    <form
      className={styles.checkoutLayout}
      action={formAction}
      onSubmit={() => {
        if (attemptInput.current && !attemptInput.current.value) {
          attemptInput.current.value = checkoutAttempt(cartFingerprint(items));
        }
        trackEvent("checkout_submit");
      }}
      data-clarity-mask="True"
    >
      <input ref={attemptInput} type="hidden" name="attemptId" defaultValue="" />
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(items.map(({ sku, quantity, price, currency }) => ({ sku, quantity, price, currency })))}
      />
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

        {state.message ? <p className={styles.error} role="alert">{state.message}</p> : null}
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
          <input type="checkbox" name="consent" value="accepted" required />
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
