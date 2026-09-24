"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { MenuIcon } from "@/components/ui/icons";
import type { CatalogCategoryLink } from "@/lib/catalog/categories";
import styles from "./mobile-menu.module.css";

const CATALOG_LINKS = [
  { label: "Бренди", href: "/catalog#catalog-filters" },
  { label: "Sale", href: "/catalog?discounted=true" },
] as const;

const SERVICE = [
  { label: "Улюблені товари", href: "/favorites" },
  { label: "Кошик", href: "/cart" },
  { label: "Доставка та оплата", href: "/delivery" },
  { label: "Обмін і повернення", href: "/returns" },
  { label: "Для бізнесу", href: "/contacts" },
  { label: "Контакти", href: "/contacts" },
] as const;

export function MobileMenu({ categories }: { categories: readonly CatalogCategoryLink[] }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    // Сторінка під шухлядою не повинна прокручуватися разом із нею.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  /** Закриття з клавіатури або кнопкою повертає фокус на бургер. */
  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label="Відкрити меню"
        aria-expanded={open}
        {...(open ? { "aria-controls": "mobile-navigation" } : {})}
        onClick={() => setOpen((value) => !value)}
      >
        <MenuIcon />
      </button>

      {open ? (
        <nav className={styles.menu} id="mobile-navigation" aria-label="Мобільна навігація">
          <div className={styles.head}>
            <Link href="/" className={styles.logo} aria-label="Italino — на головну" onClick={() => setOpen(false)}>
              <BrandLogo />
            </Link>
            <button ref={closeRef} type="button" onClick={close} aria-label="Закрити меню">×</button>
          </div>

          <div className={styles.body}>
            <p className={styles.groupTitle}>Каталог</p>
            <Link href="/catalog" onClick={() => setOpen(false)}>Усі товари</Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={category.href}
                style={{ paddingInlineStart: `${4 + category.depth * 16}px` }}
                onClick={() => setOpen(false)}
              >
                {category.name}
              </Link>
            ))}
            {CATALOG_LINKS.map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
            ))}

            <p className={styles.groupTitle}>Сервіс</p>
            {SERVICE.map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
            ))}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
