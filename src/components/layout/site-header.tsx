import Link from "next/link";
import {
  GridIcon,
  HeartIcon,
  SearchIcon,
} from "@/components/ui/icons";
import { CartLink } from "@/components/cart/cart-link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { MobileMenu } from "./mobile-menu";
import styles from "./site-header.module.css";

// Ключові розділи в шапці; повне дерево категорій (CRM → Sipec) відкриває кнопка «Каталог».
const NAV = [
  { label: "Сумки та рюкзаки", href: "/catalog/bags" },
  { label: "Пляшки та кухлі", href: "/catalog/drinkware" },
  { label: "Одяг", href: "/catalog/clothing" },
  { label: "Бренди", href: "/catalog#catalog-filters" },
  { label: "Sale", href: "/catalog?discounted=true", accent: true },
  { label: "Для бізнесу", href: "/contacts" },
];

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
          {NAV.map((item) => (
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
            placeholder="Пошук: рюкзак, пляшка, худі…"
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
          <Link href="/favorites" className={styles.iconBtn} aria-label="Улюблені товари">
            <HeartIcon />
          </Link>
          <CartLink />
        </div>
      </div>
    </header>
  );
}
