import Link from "next/link";
import {
  GridIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/icons";
import { CartLink } from "@/components/cart/cart-link";
import styles from "./site-header.module.css";

// Ключові розділи в шапці; повне дерево категорій (CRM → Sipec) відкриває кнопка «Каталог».
const NAV = [
  { label: "Сумки та рюкзаки", href: "/catalog/bags" },
  { label: "Пляшки та кухлі", href: "/catalog/drinkware" },
  { label: "Одяг", href: "/catalog/clothing" },
  { label: "Бренди", href: "/brands" },
  { label: "Sale", href: "/sale", accent: true },
  { label: "Для бізнесу", href: "/business" },
];

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`wrap ${styles.inner}`}>
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.menuBtn}`}
          aria-label="Відкрити меню"
        >
          <MenuIcon />
        </button>

        <Link href="/" className={styles.logo} aria-label="Italino — на головну">
          italino<span>.</span>
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
          <Link href="/account" className={styles.iconBtn} aria-label="Кабінет">
            <UserIcon />
          </Link>
          <Link href="/favorites" className={styles.iconBtn} aria-label="Обране">
            <HeartIcon />
          </Link>
          <CartLink />
        </div>
      </div>
    </header>
  );
}
