import Link from "next/link";
import { MailIcon, PhoneIcon } from "@/components/ui/icons";
import { STORE } from "@/lib/store";
import styles from "./site-footer.module.css";
import { BrandLogo } from "@/components/brand/brand-logo";

// `as const` обов'язковий: без літеральних типів адрес typedRoutes не перевірить <Link>.
const COLUMNS = [
  {
    title: "Каталог",
    links: [
      { label: "Сумки та рюкзаки", href: "/catalog/bags" },
      { label: "Пляшки та кухлі", href: "/catalog/drinkware" },
      { label: "Одяг", href: "/catalog/clothing" },
      { label: "Кепки та аксесуари", href: "/catalog/hats" },
      { label: "Офіс і канцелярія", href: "/catalog/office" },
      { label: "Техніка", href: "/catalog/tech" },
      { label: "Дім і кухня", href: "/catalog/home" },
      { label: "Подорожі та спорт", href: "/catalog/travel" },
      { label: "Sale", href: "/catalog?discounted=true" },
    ],
  },
  {
    title: "Покупцям",
    links: [
      { label: "Доставка та оплата", href: "/delivery" },
      { label: "Обмін і повернення", href: "/returns" },
      { label: "Оплата", href: "/legal/payment" },
    ],
  },
  {
    title: "Інформація",
    links: [
      { label: "Контакти", href: "/contacts" },
      { label: "Публічна оферта", href: "/legal/offer" },
      { label: "Політика конфіденційності", href: "/legal/privacy" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.top}`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo} aria-label="Italino — на головну">
            <BrandLogo />
          </Link>
          <p>
            Italino — постачальник сумок, пляшок, одягу, канцелярії та подарунків
            для щоденних і корпоративних потреб. Замовлення відправляємо до України щотижня.
          </p>
          <ul className={styles.contacts}>
            <li>
              <a href={STORE.phoneHref}>
                <PhoneIcon /> {STORE.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${STORE.email}`}>
                <MailIcon /> {STORE.email}
              </a>
            </li>
          </ul>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} className={styles.col} aria-label={column.title}>
            <h4>{column.title}</h4>
            <ul>
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className={`${styles.col} ${styles.schedule}`}>
          <h4>Графік поставок</h4>
          <ul>
            <li>
              Прийом замовлень — <strong>до середи 16:00</strong>
            </li>
            <li>
              Відправка з Мілана — <strong>щонеділі</strong>
            </li>
            <li>
              Доставка Новою Поштою — <strong>2–3 днів</strong>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={`wrap ${styles.bottomInner}`}>
          <p>© 2026 Italino. Усі права захищено.</p>
          <ul className={styles.legal}>
            <li>
              <Link href="/legal/offer">Публічна оферта</Link>
            </li>
            <li>
              <Link href="/legal/privacy">Політика конфіденційності</Link>
            </li>
            <li>
              <Link href="/contacts">Реквізити продавця</Link>
            </li>
          </ul>
          <ul className={styles.pay} aria-label="Способи оплати">
            <li>VISA</li>
            <li>MASTERCARD</li>
            <li>APPLE PAY</li>
            <li>GOOGLE PAY</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
