"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Drawer } from "@heroui/react/drawer";
import { BrandLogo } from "@/components/brand/brand-logo";
import { MenuIcon } from "@/components/ui/icons";
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

/** Кабінет покупця на адресі магазину в CRM — лише коли він відкритий. */
export function MobileMenu({ accountUrl = null }: { accountUrl?: string | null }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <Drawer isOpen={open} onOpenChange={setOpen}>
      <Drawer.Trigger
        type="button"
        className={styles.trigger}
        aria-label="Відкрити меню"
      >
        <MenuIcon />
      </Drawer.Trigger>
      <Drawer.Backdrop className={styles.backdrop}>
        <Drawer.Content className={styles.content} placement="left">
          <Drawer.Dialog className={styles.dialog} aria-label="Мобільне меню">
        <nav className={styles.menu} id="mobile-navigation" aria-label="Мобільна навігація">
          <div className={styles.head}>
            <Link href="/" className={styles.logo} aria-label="Italino — на головну" onClick={() => setOpen(false)}>
              <BrandLogo />
            </Link>
            <Drawer.CloseTrigger autoFocus aria-label="Закрити меню">×</Drawer.CloseTrigger>
          </div>

          <div className={styles.body}>
            <p className={styles.groupTitle}>Каталог</p>
            <Link href="/catalog" onClick={() => setOpen(false)}>Усі товари</Link>
            {CATALOG_LINKS.map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
            ))}

            <p className={styles.groupTitle}>Сервіс</p>
            {accountUrl ? (
              // Інша адреса, тож звичайне посилання, а не клієнтська навігація.
              <a href={accountUrl} onClick={() => setOpen(false)}>Особистий кабінет</a>
            ) : null}
            {SERVICE.map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
            ))}
          </div>
        </nav>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
