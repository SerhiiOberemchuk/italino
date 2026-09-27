"use client";

import Link from "next/link";
import { HeartIcon } from "@/components/ui/icons";
import { useFavoritesCount } from "@/lib/favorites";
import styles from "@/components/layout/site-header.module.css";

export function FavoritesLink() {
  const count = useFavoritesCount();

  return (
    <Link
      href="/favorites"
      className={styles.iconBtn}
      aria-label={`Улюблені товари: ${count}`}
    >
      <HeartIcon />
      {count > 0 ? <span className={styles.badge} aria-hidden="true">{count}</span> : null}
    </Link>
  );
}
