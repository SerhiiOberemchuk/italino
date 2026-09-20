"use client";

import Image from "next/image";
import Link from "next/link";
import { HeartIcon } from "@/components/ui/icons";
import { swatchColor } from "@/lib/catalog/colors";
import type { ProductCard as ProductCardModel } from "@/lib/catalog/product-cards";
import { useFavoritesStore, useIsFavorite } from "@/lib/favorites";
import { formatPrice } from "@/lib/format";
import styles from "./product-card.module.css";

const SWATCH_LIMIT = 6;

export function ProductCard({ product }: { product: ProductCardModel }) {
  const isFavorite = useIsFavorite(product.id);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const extraColors = product.colors.length - SWATCH_LIMIT;

  return (
    <article className={styles.card}>
      <Link href={product.href} className={styles.media} aria-label={product.name}>
        {product.image ? (
          <Image
            src={product.image}
            alt={product.imageAlt}
            fill
            className={styles.img}
            sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
          />
        ) : null}
        {product.badge === "sale" && product.discountPercent ? (
          <span className={`${styles.badge} ${styles.badgeSale}`}>
            −{product.discountPercent}%
          </span>
        ) : null}
        {product.badge === "new" ? (
          <span className={`${styles.badge} ${styles.badgeNew}`}>New</span>
        ) : null}
      </Link>

      <button
        type="button"
        className={isFavorite ? `${styles.wish} ${styles.wishActive}` : styles.wish}
        aria-label={isFavorite ? "Прибрати з улюблених" : "Додати в улюблені"}
        aria-pressed={isFavorite}
        onClick={() => toggleFavorite(product)}
      >
        <HeartIcon />
      </button>

      <div className={styles.body}>
        {product.brand ? <p className={styles.brand}>{product.brand}</p> : null}
        <h3 className={styles.name}>
          <Link href={product.href}>{product.name}</Link>
        </h3>
        <p className={styles.price}>
          {product.price !== null ? (
            <strong>{formatPrice(product.price, product.currency)}</strong>
          ) : (
            <strong>Ціна за запитом</strong>
          )}
          {product.compareAtPrice !== null && product.badge === "sale" ? (
            <s>{formatPrice(product.compareAtPrice, product.currency)}</s>
          ) : null}
        </p>
        <div className={styles.meta}>
          {product.colors.length > 1 ? (
            <ul
              className={styles.swatches}
              aria-label={`Кольорів: ${product.colors.length}`}
            >
              {product.colors.slice(0, SWATCH_LIMIT).map((color) => (
                <li
                  key={color}
                  title={color}
                  style={{ backgroundColor: swatchColor(color) }}
                />
              ))}
              {extraColors > 0 ? (
                <li className={styles.more}>+{extraColors}</li>
              ) : null}
            </ul>
          ) : null}
          {product.sizes.length ? (
            <ul className={styles.sizes} aria-label="Розміри">
              {product.sizes.map((size) => (
                <li key={size}>{size}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </article>
  );
}
