import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, SparklesIcon } from "@/components/ui/icons";
import type { CategoryTint, HomeCategory } from "@/lib/catalog/categories";
import styles from "./hero.module.css";

const TINT_CLASS: Record<CategoryTint, string> = {
  lime: styles.tintLime,
  sky: styles.tintSky,
  tomato: styles.tintTomato,
  mint: styles.tintMint,
  sand: styles.tintSand,
};

type Props = {
  showcase: readonly (HomeCategory & { image: string })[];
  categoryCount: number;
  modelCount: number;
  productCount: number;
};

export function Hero({ showcase, categoryCount, modelCount, productCount }: Props) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.blobLime} aria-hidden="true" />
      <div className={styles.blobTomato} aria-hidden="true" />

      <div className={`wrap ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={styles.pill}>
            <SparklesIcon /> Нові позиції щотижня
          </p>
          <h1 id="hero-title" className={styles.title}>
            Італійські знахідки — <em>на щодень</em>.
          </h1>
          <p className={styles.lead}>
            Актуальний асортимент, ціни та наявність надходять безпосередньо з каталогу Italino в CRM.
            Замовляйте для себе, команди або клієнтів — від однієї штуки.
          </p>
          <div className={styles.ctas}>
            <Link href="/catalog" className="btn btn--primary">
              Дивитися каталог <ArrowRightIcon />
            </Link>
            <Link href="/contacts" className="btn btn--ghost">
              Для бізнесу
            </Link>
          </div>
          <dl className={styles.stats}>
            <div>
              <dt>Категорії</dt>
              <dd>{categoryCount}</dd>
            </div>
            <div>
              <dt>Моделі</dt>
              <dd>{modelCount}</dd>
            </div>
            <div>
              <dt>Позиції</dt>
              <dd>{productCount}</dd>
            </div>
          </dl>
        </div>

        <ul className={styles.showcase}>
          {showcase.slice(0, 4).map((item, index) => (
            <li key={item.id} className={`${styles.tile} ${TINT_CLASS[item.tint]}`}>
              <Link href={item.href} className={styles.tileLink}>
                <span className={styles.tileImg}>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    priority={index < 2}
                    sizes="(min-width: 1024px) 22vw, 45vw"
                  />
                </span>
                <span className={styles.tileLabel}>
                  {item.name}
                  <small>{item.note}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
