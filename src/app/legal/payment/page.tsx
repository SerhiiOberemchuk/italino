import type { Metadata } from "next";
import Link from "next/link";
import { STORE } from "@/lib/store";
import styles from "../legal.module.css";

export const metadata: Metadata = { title: "Оплата", description: "Умови онлайн-оплати замовлень Italino через Hutko." };

export default function Page() {
  return <main className={`wrap ${styles.page}`}>
    <header className={styles.hero}><p className="eyebrow">Покупцям</p><h1>Оплата через Hutko</h1><p className={styles.updated}>Редакція від 20 вересня 2026 року</p></header>
    <div className={styles.content}>
      <section className={styles.section}><h2>Як відбувається оплата</h2><ol><li>Після перевірки кошика та прийняття оферти магазин створює замовлення в Obriym CRM.</li><li>CRM створює одноразове платіжне посилання Hutko на повну суму замовлення.</li><li>Браузер переходить на захищену сторінку Hutko. Apple Pay і Google Pay можна обрати, якщо вони доступні у платіжній формі.</li><li>Після завершення Hutko повертає покупця на сторінку замовлення, а підписане підтвердження оплати надсилає безпосередньо в CRM.</li></ol></section>
      <section className={styles.section}><h2>Безпека платежу</h2><p>Магазин не отримує і не зберігає повний номер картки, строк її дії або CVV. Ці дані вводяться у платіжній формі Hutko. У CRM зберігаються номер замовлення, сума, валюта, ідентифікатор і статус транзакції.</p><p>Не передавайте дані картки менеджеру в месенджері чи електронною поштою. Перевіряйте адресу платіжної сторінки перед підтвердженням.</p></section>
      <section className={styles.section}><h2>Сума і валюта</h2><p>Оплата здійснюється у гривнях. До підтвердження платежу Hutko показує суму операції. Комісія вашого банку, якщо вона передбачена його тарифами, не входить у вартість замовлення.</p></section>
      <section className={styles.section}><h2>Невдала або перервана оплата</h2><p>Якщо оплата не завершилась, замовлення може залишитися зі статусом очікування. Не оформлюйте його повторно: зверніться до продавця, вказавши номер замовлення, і ми надішлемо актуальне посилання. Для підтримки: <a href={`mailto:${STORE.email}`}>{STORE.email}</a>.</p></section>
      <section className={styles.section}><h2>Повернення коштів</h2><p>Погоджене повернення проводиться на той самий платіжний засіб через платіжну систему. Строк фактичного зарахування залежить від банку покупця. Процедура та умови описані на сторінці <Link href="/returns">«Обмін і повернення»</Link>.</p></section>
    </div>
  </main>;
}
