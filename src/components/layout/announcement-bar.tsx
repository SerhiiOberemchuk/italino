import Link from "next/link";
import { NextDispatchDate } from "@/components/home/dispatch-clock";
import { PlaneIcon } from "@/components/ui/icons";
import styles from "./announcement-bar.module.css";

export function AnnouncementBar() {
  return (
    <div className={styles.bar}>
      <div className={`wrap ${styles.inner}`}>
        <span className={styles.icon} aria-hidden="true">
          <PlaneIcon />
        </span>
        <p className={styles.text}>
          <span className={styles.long}>Відправка з Мілана щонеділі · </span>
          Наступна<span className={styles.short}> відправка з Мілана</span> —{" "}
          <NextDispatchDate className={styles.date} fallback="цієї неділі" />
          <span className={styles.long}> · Замовляйте до п’ятниці 18:00</span>
        </p>
        <Link href="/delivery" className={styles.link}>
          Як працює доставка
        </Link>
      </div>
    </div>
  );
}
