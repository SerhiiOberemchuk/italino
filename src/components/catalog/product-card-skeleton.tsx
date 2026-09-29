import { Skeleton } from "@/components/ui/skeleton";
import styles from "./product-card.module.css";

/**
 * Заготовка `ProductCard`: ті самі класи й ті самі текстові контейнери, тож
 * висота рядків і плитки збігається з карткою, яка прийде на її місце.
 * Рядка бренду немає: у більшості моделей його нема, і назва підскакувала б.
 */
export function ProductCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.media}>
        <Skeleton variant="block" className={styles.mediaSkeleton} />
      </div>
      <span className={`${styles.wish} ${styles.wishSkeleton}`} />

      <div className={styles.body}>
        <p className={styles.name}>
          <Skeleton width="92%" />
          <br />
          <Skeleton width="58%" />
        </p>
        <p className={styles.price}><strong><Skeleton width="4.5em" /></strong></p>
        {/* Кольори й розміри: висота ряду сітки — за найвищою карткою, а розміри є в багатьох. */}
        <div className={styles.meta}>
          <div className={styles.swatches}>
            {[0, 1, 2, 3].map((index) => <Skeleton key={index} variant="round" width={14} height={14} />)}
          </div>
          <div className={styles.sizes}>
            {[0, 1, 2].map((index) => <Skeleton key={index} variant="block" width={28} height={20} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
