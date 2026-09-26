import Image from "next/image";
import Link from "next/link";
import styles from "./promo-split.module.css";

type Props = {
  saleImage: string | null;
  businessImage: string | null;
  /** Найбільша знижка в каталозі, %; null — акційних моделей зараз немає. */
  maxDiscount: number | null;
};

export function PromoSplit({ saleImage, businessImage, maxDiscount }: Props) {
  return (
    <section className={`wrap ${styles.section}`} aria-label="Sale та пропозиція для бізнесу">
      <div className={styles.grid}>
        <Link href="/catalog?discounted=true" className={`${styles.tile} ${styles.tileSale}`}>
          <div className={styles.copy}>
            <p className={`eyebrow ${styles.eyebrow}`}>Кінець серій</p>
            <h3>{maxDiscount ? `Sale до −${maxDiscount}%` : "Sale"}</h3>
            <p className={styles.text}>
              Останні партії моделей, які постачальник знімає з виробництва. Коли залишок
              закінчиться, модель зникне з каталогу.
            </p>
            <span className={`btn btn--ghost ${styles.btn}`}>Встигнути до кінця серії</span>
          </div>
          {saleImage ? (
            <div className={styles.img} aria-hidden="true">
              <Image src={saleImage} alt="" fill sizes="280px" />
            </div>
          ) : null}
        </Link>

        <Link href="/contacts" className={`${styles.tile} ${styles.tileBusiness}`}>
          <div className={styles.copy}>
            <p className={`eyebrow ${styles.eyebrow}`}>Для бізнесу</p>
            <h3>Мерч для команди й клієнтів</h3>
            <p className={styles.text}>
              Від 50 штук — оптова ціна. Підберемо моделі під ваш бюджет і дедлайн,
              нанесення логотипа — за запитом.
            </p>
            <span className={`btn btn--ghost ${styles.btn}`}>Отримати пропозицію</span>
          </div>
          {businessImage ? (
            <div className={styles.img} aria-hidden="true">
              <Image src={businessImage} alt="" fill sizes="280px" />
            </div>
          ) : null}
        </Link>
      </div>
    </section>
  );
}
