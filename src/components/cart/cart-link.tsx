"use client";

import Link from "next/link";
import { BagIcon } from "@/components/ui/icons";
import { useCartCount } from "@/lib/cart";
import styles from "@/components/layout/site-header.module.css";

export function CartLink() {
  const count = useCartCount();
  return <Link href="/cart" className={styles.iconBtn} aria-label={`Кошик, товарів: ${count}`}><BagIcon />{count > 0 ? <span className={styles.badge} aria-hidden="true">{count}</span> : null}</Link>;
}
