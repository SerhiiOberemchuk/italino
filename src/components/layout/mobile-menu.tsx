"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MenuIcon } from "@/components/ui/icons";
import styles from "./mobile-menu.module.css";

const NAV = [
  { label: "Каталог", href: "/catalog" },
  { label: "Сумки та рюкзаки", href: "/catalog/bags" },
  { label: "Пляшки та кухлі", href: "/catalog/drinkware" },
  { label: "Одяг", href: "/catalog/clothing" },
  { label: "Бренди", href: "/catalog#catalog-filters" },
  { label: "Sale", href: "/catalog?discounted=true" },
  { label: "Для бізнесу", href: "/contacts" },
  { label: "Доставка та оплата", href: "/delivery" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return <div className={styles.root}>
    <button type="button" className={styles.trigger} aria-label="Відкрити меню" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen((value) => !value)}><MenuIcon /></button>
    {open ? <><button className={styles.backdrop} type="button" aria-label="Закрити меню" onClick={() => setOpen(false)} /><nav className={styles.menu} id="mobile-navigation" aria-label="Мобільна навігація"><div className={styles.menuHead}><strong>Меню</strong><button type="button" onClick={() => setOpen(false)} aria-label="Закрити меню">×</button></div>{NAV.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}</nav></> : null}
  </div>;
}
