import Link from "next/link";
import {
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  SendIcon,
} from "@/components/ui/icons";
import styles from "./site-footer.module.css";

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
      { label: "Sale", href: "/sale" },
    ],
  },
  {
    title: "Покупцям",
    links: [
      { label: "Доставка та оплата", href: "/delivery" },
      { label: "Обмін і повернення", href: "/returns" },
      { label: "Таблиця розмірів", href: "/size-guide" },
      { label: "Відстежити замовлення", href: "/track" },
      { label: "Для бізнесу", href: "/business" },
      { label: "Питання й відповіді", href: "/faq" },
    ],
  },
  {
    title: "Про нас",
    links: [
      { label: "Про Italino", href: "/about" },
      { label: "Бренди", href: "/brands" },
      { label: "Контакти", href: "/contacts" },
      { label: "Instagram", href: "https://instagram.com" },
      { label: "Telegram", href: "https://t.me" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.top}`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo} aria-label="Italino — на головну">
            italino<span>.</span>
          </Link>
          <p>
            Сумки, пляшки, одяг, канцелярія та подарунки з каталогу італійського
            постачальника. Відправка зі складу в Мілані щонеділі.
          </p>
          {/* Контакти — плейсхолдери до отримання реальних даних */}
          <ul className={styles.contacts}>
            <li>
              <a href="tel:+380000000000">
                <PhoneIcon /> +380 (00) 000-00-00
              </a>
            </li>
            <li>
              <a href="mailto:hello@italino.example">
                <MailIcon /> hello@italino.example
              </a>
            </li>
            <li>
              <a href="https://t.me" rel="noreferrer">
                <SendIcon /> Telegram
              </a>
            </li>
            <li>
              <a href="https://instagram.com" rel="noreferrer">
                <InstagramIcon /> Instagram
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
              Прийом замовлень — <strong>до п’ятниці 18:00</strong>
            </li>
            <li>
              Відправка з Мілана — <strong>щонеділі</strong>
            </li>
            <li>
              Доставка Новою Поштою — <strong>5–9 днів</strong>
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
