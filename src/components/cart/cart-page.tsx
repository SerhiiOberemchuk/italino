"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import styles from "@/app/shop.module.css";

export function CartPage() {
  const items = useCartStore((state) => state.items);
  const setItems = useCartStore((state) => state.setItems);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const validationStarted = useRef(false);
  const [validationMessage, setValidationMessage] = useState("");
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const update = (sku: string, quantity: number) => setQuantity(sku, quantity);
  useEffect(() => {
    if (!items.length || validationStarted.current) return;
    validationStarted.current = true;
    const controller = new AbortController();
    fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: items.map(({ sku, quantity }) => ({ sku, quantity })) }), signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const result = await response.json() as { items: typeof items };
        if (JSON.stringify(result.items) !== JSON.stringify(items)) { setItems(result.items); setValidationMessage("Кошик оновлено за актуальними цінами й залишками."); }
      })
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setValidationMessage("Не вдалося оновити ціни. Остаточна перевірка буде перед замовленням."); });
    return () => controller.abort();
  }, [items, setItems]);
  if (!items.length) return <div className={styles.success}><h1>Кошик порожній</h1><p>Оберіть товари в каталозі — вони збережуться тут.</p><Link className={styles.primary} href="/catalog">Перейти до каталогу</Link></div>;
  return <div className={styles.cartLayout}><section className={styles.lines}>{validationMessage ? <p className={styles.notice} role="status">{validationMessage}</p> : null}{items.map((item) => { const href = item.href ?? `/catalog?q=${encodeURIComponent(item.sku)}`; const atLimit = item.maxQuantity !== null && item.maxQuantity !== undefined && item.quantity >= item.maxQuantity; return <article className={styles.line} key={item.sku}><Link href={href} className={styles.lineImage} aria-label={`Перейти до товару: ${item.name}`}>{item.image ? <Image src={item.image} alt="" fill sizes="88px" /> : null}</Link><div><h2><Link className={styles.productLink} href={href}>{item.name}</Link></h2><p className={styles.lineMeta}>{[item.color, item.size, `SKU ${item.sku}`].filter(Boolean).join(" · ")}</p>{item.maxQuantity !== null && item.maxQuantity !== undefined ? <p className={styles.stockNote}>Доступно: {item.maxQuantity} шт.</p> : null}<div className={styles.qty}><button type="button" onClick={() => update(item.sku, item.quantity - 1)} aria-label="Зменшити кількість">−</button><span>{item.quantity}</span><button type="button" disabled={atLimit} onClick={() => update(item.sku, item.quantity + 1)} aria-label={atLimit ? "Досягнуто доступний залишок" : "Збільшити кількість"}>+</button></div><button className={styles.remove} type="button" onClick={() => update(item.sku, 0)}>Видалити</button></div><strong>{formatPrice(item.price * item.quantity, item.currency)}</strong></article>; })}</section><aside className={styles.summary}><h2>Ваше замовлення</h2><div className={styles.summaryRow}><span>Товари</span><strong>{formatPrice(total, "UAH")}</strong></div><div className={styles.summaryRow}><span>Доставка</span><span>за тарифами перевізника</span></div><div className={`${styles.summaryRow} ${styles.summaryTotal}`}><span>Разом</span><strong>{formatPrice(total, "UAH")}</strong></div><Link className={styles.primary} href="/checkout">Оформити замовлення</Link></aside></div>;
}
