import Link from "next/link";
import styles from "./newsletter.module.css";

export function Newsletter() {
  return (
    <section className={`wrap ${styles.section}`} aria-labelledby="news-title">
      <div className={styles.panel}>
        <div>
          <h2 id="news-title">Не знайшли потрібне?</h2>
          <p>
            Напишіть нам — допоможемо з вибором моделі, кольору чи розміру. Для команди
            або великого замовлення підготуємо окрему пропозицію.
          </p>
        </div>
        <div>
          <div className={styles.form}>
            <Link href="/contacts" className="btn btn--primary btn--sm">
              Написати нам
            </Link>
            <Link href="/catalog?sort=newest" className="btn btn--ghost btn--sm">
              Дивитися новинки
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
