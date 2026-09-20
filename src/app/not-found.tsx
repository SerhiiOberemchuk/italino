import Link from "next/link";
import styles from "./shop.module.css";

export default function NotFound() {
  return (
    <main className={`wrap ${styles.page}`}>
      <div className={styles.success}>
        <p className="eyebrow">404</p>
        <h1>Сторінку не знайдено</h1>
        <p>Можливо, товар більше не доступний або адресу було змінено.</p>
        <Link className={styles.primary} href="/catalog">До каталогу</Link>
      </div>
    </main>
  );
}
