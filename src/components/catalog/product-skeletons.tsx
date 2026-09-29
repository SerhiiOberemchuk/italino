import { Skeleton } from "@/components/ui/skeleton";
import styles from "@/app/shop.module.css";

/*
 * Скелетони сторінки товару. Ті самі класи й контейнери, що й у справжніх
 * блоків, тож дані стають на місце заготовки без зсувів. Сталі підписи
 * («Артикул:») лишаються текстом.
 */

/** Бренд і назва. Рядка бренду немає: у більшості моделей його нема. */
export function ProductTitleSkeleton() {
  return (
    <>
      <p className={styles.brand} />
      <div className={styles.titleSkeleton} aria-hidden="true">
        <Skeleton width="92%" />
        <br />
        <Skeleton width="54%" />
      </div>
    </>
  );
}

/** Ціна, наявність, вибір кольору, кнопка й артикул. */
export function BuyBoxSkeleton() {
  return (
    <div aria-hidden="true">
      <p className={styles.price}><Skeleton width="4.5em" /></p>
      <p className={styles.availability}><Skeleton width="9em" /></p>
      <div className={styles.optionGroup}>
        <p className={styles.optionLabel}><Skeleton width="7em" /></p>
        <div className={styles.swatches}>
          {[0, 1, 2, 3, 4].map((index) => <Skeleton key={index} variant="round" width={44} height={44} />)}
        </div>
      </div>
      <Skeleton variant="round" width={220} height={50} />
      <p className={styles.lineMeta}>Артикул: <Skeleton width="7em" /></p>
    </div>
  );
}

/** Опис і таблиця характеристик. */
export function ProductSpecsSkeleton() {
  return (
    <div aria-hidden="true">
      <p className={styles.description}>
        <Skeleton width="100%" />
        <br />
        <Skeleton width="96%" />
        <br />
        <Skeleton width="98%" />
        <br />
        <Skeleton width="62%" />
      </p>
      <table className={styles.specs}>
        <tbody>
          {["44%", "30%", "52%", "36%"].map((width) => (
            <tr key={width}>
              <th><Skeleton width="70%" /></th>
              <td><Skeleton width={width} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
