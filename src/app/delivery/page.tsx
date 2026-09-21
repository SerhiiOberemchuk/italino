import type { Metadata } from "next";
import Link from "next/link";
import { CutoffCountdown, NextDispatchDate } from "@/components/home/dispatch-clock";
import { SCHEDULE_COPY } from "@/lib/shipping/schedule";
import { getFreeShippingThreshold } from "@/lib/crm/catalog";
import { formatThreshold } from "@/lib/shipping/free-shipping";
import styles from "../shop.module.css";

export const metadata: Metadata = { title: "Доставка та оплата" };

export default async function Page() {
  const freeFrom = await getFreeShippingThreshold();
  return (
    <main className={`wrap ${styles.page}`}>
      <div className={styles.hero}>
        <div><p className="eyebrow">Італія → Україна</p><h1>Доставка та оплата</h1></div>
        <p>Italino формує щотижневі поставки та організовує доставку замовлень в Україну.</p>
      </div>

      <div className={styles.checkoutLayout}>
        <div className={styles.form}>
          <section className={styles.section}>
            <h2>Як відбувається доставка</h2>
            <ol>
              <li>
                <strong>{SCHEDULE_COPY.cutoffUntil[0].toUpperCase() + SCHEDULE_COPY.cutoffUntil.slice(1)}</strong>{" "}
                за київським часом — приймаємо замовлення в поставку цього тижня.
              </li>
              <li>
                <strong><NextDispatchDate fallback={SCHEDULE_COPY.dispatchName} /></strong> — відправляємо поставку
                зі складу в Мілані.
              </li>
              <li>
                <strong>{SCHEDULE_COPY.transit}</strong> від відправки — і посилка у вашому відділенні Нової Пошти,
                зазвичай {SCHEDULE_COPY.arrivalOn}.
              </li>
            </ol>
          </section>

          <section className={styles.section}>
            <h2>Способи доставки</h2>
            <p>
              Доставляємо Новою Поштою — на відділення або в поштомат у будь-якому місті України. Пункт отримання
              вкажіть під час оформлення замовлення.
            </p>
            <p>
              Доставку з Мілана до України враховано в ціні товару. Нову Пошту оплачує покупець за тарифами
              перевізника під час отримання
              {freeFrom !== null ? `, а для замовлень від ${formatThreshold(freeFrom)} доставка безкоштовна` : ""}.
              Строки орієнтовні й залежать від митного оформлення та роботи перевізника.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Оплата</h2>
            <p>Замовлення оплачується на захищеній платіжній сторінці. Дані картки не надходять до Italino.</p>
            <p><Link href="/legal/payment"><u>Умови оплати</u></Link></p>
          </section>
        </div>

        <aside className={styles.summary}>
          <h2>Наступна відправка</h2>
          <CutoffCountdown />
          <p className={styles.lineMeta}>Точний строк залежить від митного оформлення та маршруту перевізника.</p>
        </aside>
      </div>
    </main>
  );
}
