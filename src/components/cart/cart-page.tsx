"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { amountToFreeShipping, qualifiesForFreeShipping } from "@/lib/shipping/free-shipping";
import styles from "@/app/shop.module.css";

/** `freeShippingFrom` — поріг безкоштовної доставки з CRM; `null` — не задано. */
export function CartPage({ freeShippingFrom }: { freeShippingFrom: number | null }) {
  const hydrated = useCartStore((state) => state.hydrated);
  const items = useCartStore((state) => state.items);
  const setItems = useCartStore((state) => state.setItems);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const [validationMessage, setValidationMessage] = useState("");
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeShipping = qualifiesForFreeShipping(total, freeShippingFrom);

  /*
   * Звірка цін і залишків один раз після регідрації. Поточні рядки читаємо
   * через getState(), а не з підписки: інакше будь-яка зміна кількості
   * перезапустила б ефект і обірвала запит, що вже в дорозі.
   */
  useEffect(() => {
    if (!hydrated) return;
    const current = useCartStore.getState().items;
    if (!current.length) return;

    const controller = new AbortController();
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: current.map(({ sku, quantity }) => ({ sku, quantity })) }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const result = await response.json() as { items: typeof current };
        if (JSON.stringify(result.items) === JSON.stringify(useCartStore.getState().items)) return;
        setItems(result.items);
        setValidationMessage("Кошик оновлено за актуальними цінами й залишками.");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setValidationMessage("Не вдалося оновити ціни. Остаточна перевірка буде перед замовленням.");
      });

    return () => controller.abort();
  }, [hydrated, setItems]);

  if (!hydrated) return <p className={styles.empty}>Завантажуємо кошик…</p>;

  if (!items.length) {
    return (
      <div className={styles.success}>
        <h1>Кошик порожній</h1>
        <p>Оберіть товари в каталозі — вони збережуться тут.</p>
        <Link className={styles.primary} href="/catalog">Перейти до каталогу</Link>
      </div>
    );
  }

  return (
    <div className={styles.cartLayout}>
      <section className={styles.lines}>
        {validationMessage ? <p className={styles.notice} role="status">{validationMessage}</p> : null}
        {items.map((item) => {
          const href = (item.href ?? `/catalog?q=${encodeURIComponent(item.sku)}`) as Route;
          const max = item.maxQuantity;
          const atLimit = max !== null && max !== undefined && item.quantity >= max;
          return (
            <article className={styles.line} key={item.sku}>
              <Link href={href} className={styles.lineImage} aria-label={`Перейти до товару: ${item.name}`}>
                {item.image ? <Image src={item.image} alt="" fill sizes="88px" /> : null}
              </Link>
              <div>
                <h2><Link className={styles.productLink} href={href}>{item.name}</Link></h2>
                <p className={styles.lineMeta}>
                  {[item.color, item.size, `SKU ${item.sku}`].filter(Boolean).join(" · ")}
                </p>
                {max !== null && max !== undefined ? <p className={styles.stockNote}>Доступно: {max} шт.</p> : null}
                <div className={styles.qty}>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.sku, item.quantity - 1)}
                    aria-label="Зменшити кількість"
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    disabled={atLimit}
                    onClick={() => setQuantity(item.sku, item.quantity + 1)}
                    aria-label={atLimit ? "Досягнуто доступний залишок" : "Збільшити кількість"}
                  >
                    +
                  </button>
                </div>
                <button className={styles.remove} type="button" onClick={() => setQuantity(item.sku, 0)}>
                  Видалити
                </button>
              </div>
              <strong>{formatPrice(item.price * item.quantity, item.currency)}</strong>
            </article>
          );
        })}
      </section>

      <aside className={styles.summary}>
        <h2>Ваше замовлення</h2>
        <div className={styles.summaryRow}><span>Товари</span><strong>{formatPrice(total, "UAH")}</strong></div>
        <div className={styles.summaryRow}>
          <span>Доставка Новою Поштою</span>
          {freeShipping ? <strong>безкоштовно</strong> : <span>за тарифами перевізника</span>}
        </div>
        {freeShippingFrom !== null && !freeShipping ? (
          <p className={styles.lineMeta}>
            Ще {formatPrice(amountToFreeShipping(total, freeShippingFrom), "UAH")} — і доставка буде безкоштовною.
          </p>
        ) : null}
        <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
          <span>Разом</span><strong>{formatPrice(total, "UAH")}</strong>
        </div>
        <Link className={styles.primary} href="/checkout">Оформити замовлення</Link>
      </aside>
    </div>
  );
}
