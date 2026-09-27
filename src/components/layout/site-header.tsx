import Link from "next/link";
import {
  GridIcon,
  SearchIcon,
} from "@/components/ui/icons";
import { CartLink } from "@/components/cart/cart-link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { FavoritesLink } from "@/components/favorites/favorites-link";
import { MobileMenu } from "./mobile-menu";
import styles from "./site-header.module.css";

const SECONDARY_NAV = [
  { label: "Бренди", href: "/catalog#catalog-filters", accent: false },
  { label: "Sale", href: "/catalog?discounted=true", accent: true },
  { label: "Для бізнесу", href: "/contacts", accent: false },
] as const;

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`wrap ${styles.inner}`}>
        <MobileMenu />

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
          <FavoritesLink />
          <CartLink />
        </div>
      </div>
    </header>
  );
}
