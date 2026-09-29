import { Skeleton } from "@/components/ui/skeleton";
import styles from "./order-status.module.css";

/**
 * Картка статусу до відповіді CRM: та сама рамка й ті самі підписи, що в
 * `OrderStatus`, заготовки — лише на місці статусу, номера, дат і сум.
 */
export function OrderStatusSkeleton() {
  return (
    <div className={styles.card}>
      <p className="sr-only" role="status">Завантажуємо замовлення…</p>
      <div aria-hidden="true">
        <div className={styles.topline}>
          <p className="eyebrow">Статус замовлення</p>
          <Skeleton variant="round" width={72} height={32} />
        </div>
        <div className={styles.title}><Skeleton width="68%" /></div>
        <p className={styles.lead}>
          <Skeleton width="100%" />
          <br />
          <Skeleton width="58%" />
        </p>
        <div className={styles.payment}>
          <span>Оплата</span>
          <strong><Skeleton width="8em" /></strong>
        </div>
        <dl className={styles.details}>
          <div><dt>Номер замовлення</dt><dd><Skeleton width="7em" /></dd></div>
          <div><dt>Створено</dt><dd><Skeleton width="9em" /></dd></div>
        </dl>
        <section className={styles.receipt}>
          <div className={styles.receiptHead}>
            <div className={styles.receiptTitle}><Skeleton width="9em" /></div>
          </div>
          <dl className={styles.details}>
            <div><dt>Доставка Новою Поштою</dt><dd><Skeleton width="10em" /></dd></div>
            <div><dt><Skeleton width="6em" /></dt><dd><Skeleton width="5em" /></dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}
