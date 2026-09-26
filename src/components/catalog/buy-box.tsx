"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useCartStore, useSkuInCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";
import { swatchColor } from "@/lib/catalog/colors";
import { isPurchasable, pickVariant, sizesForColor, variantAxes } from "@/lib/catalog/variants";
import { useVariantSelection } from "@/components/catalog/variant-selection";
import styles from "@/app/shop.module.css";

/** Колір кружечка передається через CSS-змінну `--swatch-color` (CSS малює саму форму). */
function swatchStyle(name: string): CSSProperties {
  return { "--swatch-color": swatchColor(name) } as CSSProperties;
}

export function BuyBox() {
  const { variants, selected, select } = useVariantSelection();
  const inCart = useSkuInCart(selected.sku ?? "");
  const addCartItem = useCartStore((state) => state.addItem);

  const axes = variantAxes(variants);
  const purchasable = isPurchasable(selected);
  // Три взаємовиключні розкладки вибору варіанта — саме одна з них рендериться.
  const showColorSwatches = axes.colors.length > 1;
  const showSizeChips = axes.hasSizes;
  const showFlatFallback = axes.colors.length === 0 && !axes.hasSizes && variants.length > 1;

  function addToCart() {
    if (!selected.sku || selected.price === null) return;
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

  function selectColor(name: string) {
    // Той самий розмір лишається обраним у новому кольорі, якщо він там є.
    select(pickVariant(variants, { color: name, size: selected.size }).sku ?? "");
  }

  function selectSize(size: string) {
    select(pickVariant(variants, { color: selected.color, size }).sku ?? "");
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

      {showColorSwatches ? (
        <fieldset className={styles.optionGroup}>
          <legend>Колір: {selected.color}</legend>
          <div className={styles.swatches}>
            {axes.colors.map((color) => (
              <button
                type="button"
                key={color.name}
                className={[
                  styles.swatch,
                  selected.color === color.name ? styles.swatchActive : "",
                  color.available ? "" : styles.swatchUnavailable,
                ].filter(Boolean).join(" ")}
                style={swatchStyle(color.name)}
                aria-label={color.name}
                aria-pressed={selected.color === color.name}
                onClick={() => selectColor(color.name)}
              />
            ))}
          </div>
        </fieldset>
      ) : null}

      {showSizeChips ? (
        <fieldset className={styles.optionGroup}>
          <legend>Розмір</legend>
          <div className={styles.chips}>
            {sizesForColor(variants, axes.colors.length > 0 ? selected.color : null).map((row) => (
              <label className={styles.chip} key={row.sku || row.size}>
                <input
                  type="radio"
                  name="size"
                  value={row.sku}
                  checked={selected.size === row.size}
                  disabled={!row.available}
                  onChange={() => selectSize(row.size)}
                />
                <span>{row.size}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {showFlatFallback ? (
        <fieldset className={styles.optionGroup}>
          <legend>Оберіть варіант</legend>
          <div className={styles.chips}>
            {variants.map((variant) => (
              <label className={styles.chip} key={variant.id}>
                <input
                  type="radio"
                  name="variant"
                  value={variant.sku ?? ""}
                  checked={selected.sku === variant.sku}
                  onChange={() => select(variant.sku ?? "")}
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
