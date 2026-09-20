import type { Metadata } from "next";
import { SellerDetails } from "@/components/legal/seller-details";
import { STORE } from "@/lib/store";
import styles from "../legal/legal.module.css";

export const metadata: Metadata = { title: "Контакти та реквізити продавця", description: "Контакти й офіційні реквізити продавця інтернет-магазину Italino." };

export default function Page() {
  return <main className={`wrap ${styles.page}`}>
    <header className={styles.hero}><p className="eyebrow">Italino</p><h1>Контакти та реквізити</h1><p className={styles.updated}>Звернення щодо замовлень, оплати, доставки та повернення</p></header>
    <div className={styles.content}>
      <section className={styles.section}><h2>Продавець</h2><SellerDetails /></section>
      <section className={styles.section}><h2>Як звернутися</h2><p>Телефон: <a href={STORE.phoneHref}>{STORE.phone}</a><br />E-mail: <a href={`mailto:${STORE.email}`}>{STORE.email}</a></p><p>У зверненні про замовлення вкажіть його номер. Звернення електронною поштою приймаються цілодобово; відповідь надаємо у робочий час.</p></section>
      <section className={styles.section}><h2>Оплата</h2><p>Одержувачем коштів за товари є {STORE.legalName}. Оплата карткою здійснюється на захищеній платіжній сторінці. Рахунок продавця відкритий в АТ «ПУМБ»; реквізити для безготівкового переказу надаються у рахунку або погодженому договорі.</p></section>
    </div>
  </main>;
}
