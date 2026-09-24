import Link from "next/link";
import { ClockIcon, MailIcon, PhoneIcon } from "@/components/ui/icons";
import { STORE } from "@/lib/store";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ObriymMark } from "@/components/brand/obriym-mark";
import { MastercardMark, ProstirMark, VisaMark } from "@/components/ui/payment-marks";
import { SCHEDULE_COPY } from "@/lib/shipping/schedule";
import { categoryLinks } from "@/lib/catalog/categories";
import type { CrmCategory } from "@/lib/crm/types";
import styles from "./site-footer.module.css";

const COLUMNS = [
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
      { label: "Умови використання", href: "/legal/terms" },
      { label: "Політика конфіденційності", href: "/legal/privacy" },
    ],
  },
] as const;

export function SiteFooter({ categories }: { categories: readonly CrmCategory[] }) {
  const catalogLinks = categoryLinks(categories, true);

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
            <li className={styles.hours}>
              <ClockIcon /> {STORE.hours[0].toUpperCase() + STORE.hours.slice(1)}
            </li>
          </ul>
        </div>

        <nav className={styles.col} aria-label="Каталог">
          <h4>Каталог</h4>
          <ul>
            {catalogLinks.map((category) => (
              <li key={category.id}><Link href={category.href}>{category.name}</Link></li>
            ))}
            <li><Link href="/catalog?discounted=true">Sale</Link></li>
          </ul>
        </nav>

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
              Прийом замовлень — <strong>{SCHEDULE_COPY.cutoffUntil}</strong>
            </li>
            <li>
              Відправка з Мілана — <strong>{SCHEDULE_COPY.dispatchEvery}</strong>
            </li>
            <li>
              Отримання — <strong>{SCHEDULE_COPY.arrivalDays}</strong>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={`wrap ${styles.bottomInner}`}>
          <p>© 2026 Italino. Усі права захищено.</p>
          <a className={styles.partner} href="https://obriym-crm.com" target="_blank" rel="noopener">
            <span>Технологічний партнер</span>
            <ObriymMark />
            <span className={styles.partnerName}>Obriym CRM</span>
          </a>
          <ul className={styles.legal}>
            <li>
              <Link href="/legal/offer">Публічна оферта</Link>
            </li>
            <li>
              <Link href="/legal/terms">Умови використання</Link>
            </li>
            <li>
              <Link href="/legal/privacy">Політика конфіденційності</Link>
            </li>
            <li>
              <Link href="/contacts">Реквізити продавця</Link>
            </li>
          </ul>
          <ul className={styles.pay} aria-label="Способи оплати">
            <li className={styles.payMark}><VisaMark /></li>
            <li className={styles.payMark}><MastercardMark /></li>
            <li className={styles.payMark}><ProstirMark /></li>
            <li>APPLE PAY</li>
            <li>GOOGLE PAY</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
