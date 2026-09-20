import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/ui/icons";
import type { HomeCategory } from "@/lib/mock/home";
import styles from "./category-tiles.module.css";

const TINT_CLASS: Record<HomeCategory["tint"], string> = {
  lime: styles.tintLime,
  sky: styles.tintSky,
  tomato: styles.tintTomato,
  mint: styles.tintMint,
  sand: styles.tintSand,
};

export function CategoryTiles({ categories }: { categories: readonly HomeCategory[] }) {
  return (
    <section className={`wrap ${styles.section}`} aria-labelledby="cats-title">
      <div className="section-head">
        <div>
          <p className="eyebrow">Каталог</p>
          <h2 id="cats-title" className="section-title">
            Обирайте за категорією
          </h2>
        </div>
        <Link href="/catalog" className="btn btn--ghost">
          Увесь каталог
        </Link>
      </div>

      <div className={styles.grid}>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={category.href}
            className={`${styles.tile} ${TINT_CLASS[category.tint]}`}
          >
            <span className={styles.imgWrap}>
              <Image
                src={category.image}
                alt=""
                fill
                className={styles.img}
                sizes="(min-width: 768px) 25vw, 50vw"
              />
            </span>
            <span className={styles.label}>
              <span className={styles.name}>
                {category.name}
                <small>{category.note}</small>
              </span>
              <span className={styles.arrow} aria-hidden="true">
                <ArrowUpRightIcon />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
