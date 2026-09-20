import Link from "next/link";
import styles from "./newsletter.module.css";

export function Newsletter() {
  return (
    <section className={`wrap ${styles.section}`} aria-labelledby="news-title">
      <div className={styles.panel}>
        <div>
          <h2 id="news-title">Нові надходження щотижня</h2>
          <p>
            Переглядайте свіжі позиції каталогу та звертайтеся до нас, якщо
            потрібна допомога з вибором або велике замовлення.
          </p>
        </div>
        <div>
          <div className={styles.form}>
            <Link href="/catalog?sort=newest" className="btn btn--primary btn--sm">
              Дивитися новинки
            </Link>
            <Link href="/contacts" className="btn btn--ghost btn--sm">
              Зв’язатися з нами
            </Link>
          </div>
          <p className={styles.hint}>
            Актуальні контакти й реквізити продавця наведені на сторінці контактів.
          </p>
        </div>
      </div>
    </section>
  );
}
