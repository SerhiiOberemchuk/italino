import styles from "./shop.module.css";
export default function Loading() { return <main className={`wrap ${styles.page}`}><p className={styles.empty}>Завантажуємо…</p></main>; }
