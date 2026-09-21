"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCartStore, useSkuInCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { CrmProduct } from "@/lib/crm/types";
import { trackEvent } from "@/lib/analytics";
import styles from "@/app/shop.module.css";

const UNAVAILABLE = ["out_of_stock", "discontinued"];

export function BuyBox({ variants }: { variants: CrmProduct[] }) {
  const [sku, setSku] = useState(variants[0]?.sku ?? "");
  const selected = useMemo(() => variants.find((item) => item.sku === sku) ?? variants[0], [sku, variants]);
  const inCart = useSkuInCart(selected?.sku ?? "");
  const addCartItem = useCartStore((state) => state.addItem);
  if (!selected) return null;

  const purchasable = Boolean(
    selected.sku
    && selected.price !== null
    && (selected.stock === null || selected.stock > 0)
    && !UNAVAILABLE.includes(selected.availability),
  );

  function addToCart() {
    if (!selected?.sku || selected.price === null) return;
    trackEvent("add_to_cart", {
      currency: selected.currency,
      value: selected.price,
      items: [{ item_id: selected.sku, item_name: selected.name, price: selected.price, quantity: 1 }],
    });
    const key = selected.productGroupId ?? selected.id;
    addCartItem({
      productId: selected.id,
      sku: selected.sku,
      name: selected.name,
      image: selected.images[0]?.url ?? null,
      price: selected.price,
      currency: selected.currency,
      color: selected.color,
      size: selected.size,
      quantity: 1,
      href: `/product/${encodeURIComponent(key)}`,
      maxQuantity: selected.stock,
    });
  }

  return (
    <>
      <p className={styles.price}>
        <strong>{selected.price === null ? "Ціна за запитом" : formatPrice(selected.price, selected.currency)}</strong>
        {selected.compareAtPrice && selected.price !== null && selected.compareAtPrice > selected.price
          ? <s>{formatPrice(selected.compareAtPrice, selected.currency)}</s>
          : null}
      </p>

      <p className={styles.availability}>
        {selected.availability === "in_stock"
          ? `В наявності${selected.stock !== null ? ` · ${selected.stock} шт.` : ""}`
          : selected.availability === "on_order" ? "Під замовлення" : "Наразі недоступний"}
      </p>

      {variants.length > 1 ? (
        <fieldset className={styles.optionGroup}>
          <legend>Оберіть варіант</legend>
          <div className={styles.chips}>
            {variants.map((variant) => (
              <label className={styles.chip} key={variant.id}>
                <input
                  type="radio"
                  name="variant"
                  value={variant.sku ?? ""}
                  checked={sku === variant.sku}
                  onChange={() => setSku(variant.sku ?? "")}
                />
                <span>{[variant.color, variant.size].filter(Boolean).join(" · ") || variant.sku}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <button className={styles.primary} type="button" disabled={!purchasable || inCart} onClick={addToCart}>
        {inCart ? "У кошику" : purchasable ? "Додати в кошик" : "Недоступно для замовлення"}
      </button>

      {inCart ? (
        <p className={styles.notice} role="status">
          Товар додано. <Link href="/cart"><u>Перейти до кошика</u></Link>
        </p>
      ) : null}

      <p className={styles.lineMeta}>Артикул: {selected.sku ?? "—"}</p>
    </>
  );
}
