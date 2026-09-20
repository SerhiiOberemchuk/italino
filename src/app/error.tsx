"use client";
import styles from "./shop.module.css";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className={`wrap ${styles.page}`}><div className={styles.success}><h1>Щось пішло не так</h1><p>Не вдалося завантажити сторінку. Спробуйте ще раз.</p><button className={styles.primary} type="button" onClick={reset}>Повторити</button></div></main>; }
