"use client";

import { useMemo, useState } from "react";
import { addCartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { CrmProduct } from "@/lib/crm/types";
import styles from "@/app/shop.module.css";

export function BuyBox({ variants }: { variants: CrmProduct[] }) {
  const [sku, setSku] = useState(variants[0]?.sku ?? "");
  const [added, setAdded] = useState(false);
  const selected = useMemo(() => variants.find((item) => item.sku === sku) ?? variants[0], [sku, variants]);
  if (!selected) return null;
  const purchasable = Boolean(selected.sku && selected.price !== null && !["out_of_stock", "discontinued"].includes(selected.availability));
  return <>
    <p className={styles.price}><strong>{selected.price === null ? "Ціна за запитом" : formatPrice(selected.price, selected.currency)}</strong>{selected.compareAtPrice && selected.price !== null && selected.compareAtPrice > selected.price ? <s>{formatPrice(selected.compareAtPrice, selected.currency)}</s> : null}</p>
    <p className={styles.availability}>{selected.availability === "in_stock" ? `В наявності${selected.stock !== null ? ` · ${selected.stock} шт.` : ""}` : selected.availability === "on_order" ? "Під замовлення" : "Наразі недоступний"}</p>
    {variants.length > 1 ? <fieldset className={styles.optionGroup}><legend>Оберіть варіант</legend><div className={styles.chips}>{variants.map((variant) => <label className={styles.chip} key={variant.id}><input type="radio" name="variant" value={variant.sku ?? ""} checked={sku === variant.sku} onChange={() => { setSku(variant.sku ?? ""); setAdded(false); }} /><span>{[variant.color, variant.size].filter(Boolean).join(" · ") || variant.sku}</span></label>)}</div></fieldset> : null}
    <button className={styles.primary} disabled={!purchasable} onClick={() => { if (!selected.sku || selected.price === null) return; addCartItem({ productId: selected.id, sku: selected.sku, name: selected.name, image: selected.images[0]?.url ?? null, price: selected.price, currency: selected.currency, color: selected.color, size: selected.size, quantity: 1 }); setAdded(true); }} type="button">{purchasable ? "Додати в кошик" : "Недоступно для замовлення"}</button>
    {added ? <p className={styles.notice} role="status">Товар додано. <a href="/cart"><u>Перейти до кошика</u></a></p> : null}
    <p className={styles.lineMeta}>Артикул: {selected.sku ?? "—"}</p>
  </>;
}
