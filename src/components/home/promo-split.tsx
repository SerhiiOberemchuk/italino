import Image from "next/image";
import Link from "next/link";
import styles from "./promo-split.module.css";

export function PromoSplit({ saleImage, businessImage }: { saleImage: string | null; businessImage: string | null }) {
  return (
    <section className={`wrap ${styles.section}`} aria-label="Sale та пропозиція для бізнесу">
      <div className={styles.grid}>
        <Link href="/catalog?discounted=true" className={`${styles.tile} ${styles.tileSale}`}>
          <div className={styles.copy}>
            <p className={`eyebrow ${styles.eyebrow}`}>Кінець серій та останні партії</p>
            <h3>Sale до −50%</h3>
            <p className={styles.text}>
              Добірка моделей з обмеженим залишком і спеціальною ціною.
              Актуальний асортимент оновлюємо перед кожною поставкою.
            </p>
            <span className={`btn btn--ghost ${styles.btn}`}>Дивитися sale</span>
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
            <h3>Мерч і подарунки з логотипом</h3>
            <p className={styles.text}>
              Шопери, пляшки, ручки та блокноти для команди й клієнтів. Оптові
              ціни від 50 шт., нанесення логотипа — за запитом.
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
