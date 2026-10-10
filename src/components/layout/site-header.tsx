import Link from "next/link";
import { Suspense } from "react";
import {
  GridIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/icons";
import { CartLink } from "@/components/cart/cart-link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { FavoritesLink } from "@/components/favorites/favorites-link";
import { getCustomerAccountUrl } from "@/lib/crm/catalog";
import { MobileMenu } from "./mobile-menu";
import styles from "./site-header.module.css";

const SECONDARY_NAV = [
  { label: "Бренди", href: "/catalog#catalog-filters", accent: false },
  { label: "Sale", href: "/catalog?discounted=true", accent: true },
  { label: "Для бізнесу", href: "/contacts", accent: false },
] as const;

/** Кабінет покупця живе в CRM на адресі магазину; іконка є, лише поки він відкритий. */
async function AccountLink() {
  const url = await getCustomerAccountUrl();
  if (!url) return null;
  return (
    <a
      href={url}
      className={`${styles.iconBtn} ${styles.accountBtn}`}
      aria-label="Особистий кабінет"
    >
      <UserIcon />
    </a>
  );
}

async function MobileMenuWithAccount() {
  return <MobileMenu accountUrl={await getCustomerAccountUrl()} />;
}

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`wrap ${styles.inner}`}>
        <Suspense fallback={<MobileMenu />}>
          <MobileMenuWithAccount />
        </Suspense>

        <Link href="/" className={styles.logo} aria-label="Italino — на головну">
          <BrandLogo />
        </Link>

        <nav className={styles.nav} aria-label="Основна навігація">
          <Link href="/catalog" className={styles.catalogBtn}>
            <GridIcon /> Каталог
          </Link>
          {SECONDARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.accent ? `${styles.navLink} ${styles.navAccent}` : styles.navLink
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form className={styles.search} role="search" action="/catalog">
          <SearchIcon />
          <input
            type="search"
            name="q"
            placeholder="Пошук за назвою або артикулом…"
            aria-label="Пошук по каталогу"
            autoComplete="off"
          />
        </form>

        <div className={styles.actions}>
          <Link
            href="/catalog"
            className={`${styles.iconBtn} ${styles.searchBtn}`}
            aria-label="Пошук"
          >
            <SearchIcon />
          </Link>
          <Suspense fallback={null}>
            <AccountLink />
          </Suspense>
          <FavoritesLink />
          <CartLink />
        </div>
      </div>
    </header>
  );
}
