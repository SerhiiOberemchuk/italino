import Link from "next/link";
import { CutoffCountdown, NextDispatchDate } from "./dispatch-clock";
import styles from "./dispatch-banner.module.css";

const TIMELINE = [
  {
    when: "Пт, 18:00",
    what: "Закриваємо прийом замовлень",
    desc: "Усе, що оформлено до цього часу, їде цією поставкою.",
    hot: false,
  },
  {
    when: "Нд",
    what: "Відправка з Мілана",
    desc: "Одна поставка на всі замовлення тижня.",
    hot: true,
  },
  {
    when: "+4–6 днів",
    what: "Поставка в Україні",
    desc: "Митне оформлення й передача в Нову Пошту, з’являється ТТН.",
    hot: false,
  },
  {
    when: "+1–2 дні",
    what: "Отримання",
    desc: "Відділення, поштомат або кур’єр Нової Пошти.",
    hot: false,
  },
];

export function DispatchBanner() {
  return (
    <section className={`wrap ${styles.section}`} aria-labelledby="dispatch-title">
      <div className={styles.panel}>
        <div className={styles.glowTomato} aria-hidden="true" />
        <div className={styles.glowLime} aria-hidden="true" />

        <div className={styles.inner}>
          <div>
            <p className={`eyebrow ${styles.eyebrow}`}>Наступна відправка з Мілана</p>
            <h2 id="dispatch-title" className={styles.date}>
              <NextDispatchDate fallback="цієї неділі" />
            </h2>
            <p className={styles.note}>
              Прийом замовлень у цю поставку закривається в п’ятницю о 18:00.
              Усе, що оформлено пізніше, поїде наступної неділі.
            </p>
            <CutoffCountdown />
            <div className={styles.ctas}>
              <Link href="/catalog" className="btn btn--lime">
                Встигнути замовити
              </Link>
              <Link href="/track" className="btn btn--light">
                Відстежити замовлення
              </Link>
            </div>
          </div>

          <ol className={styles.timeline} aria-label="Етапи поставки">
            {TIMELINE.map((item) => (
              <li
                key={item.when}
                className={item.hot ? `${styles.tItem} ${styles.tItemHot}` : styles.tItem}
              >
                <span className={styles.tWhen}>{item.when}</span>
                <span className={styles.tWhat}>{item.what}</span>
                <span className={styles.tDesc}>{item.desc}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
