"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { BagIcon } from "@/components/ui/icons";
import { CART_EVENT, CART_STORAGE_KEY, readCart } from "@/lib/cart";
import styles from "@/components/layout/site-header.module.css";

function subscribe(callback: () => void) { window.addEventListener("storage", callback); window.addEventListener(CART_EVENT, callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener(CART_EVENT, callback); }; }
function snapshot() { return localStorage.getItem(CART_STORAGE_KEY) ?? "[]"; }
function serverSnapshot() { return "[]"; }

export function CartLink() {
  useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const count = readCart().reduce((sum, item) => sum + item.quantity, 0);
  return <Link href="/cart" className={styles.iconBtn} aria-label={`Кошик, товарів: ${count}`}><BagIcon />{count > 0 ? <span className={styles.badge} aria-hidden="true">{count}</span> : null}</Link>;
}
