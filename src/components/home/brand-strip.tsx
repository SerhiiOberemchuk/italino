import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { CatalogBrand } from "@/lib/catalog/brands";
import styles from "./brand-strip.module.css";

export function BrandStrip({ brands }: { brands: readonly CatalogBrand[] }) {
  if (!brands.length) return null;

  return (
    <section className={styles.section} aria-labelledby="brands-title">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="eyebrow">Бренди</p>
            <h2 id="brands-title" className="section-title">
              Бренди нашого каталогу
            </h2>
            <p className="section-lead">
              Показуємо лише ті бренди, моделі яких зараз є на складі в Мілані й можуть поїхати
              найближчою поставкою.
            </p>
          </div>
          <Link href="/catalog#catalog-filters" className="btn btn--ghost">
            Усі бренди
          </Link>
        </div>

        <ul className={styles.grid}>
          {brands.map((brand) => (
            <li key={brand.id} className={styles.card}>
              <Link href={brand.href} className={styles.media} aria-label={brand.name}>
                {brand.image ? (
                  <Image
                    src={brand.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                  />
                ) : <span className={styles.placeholder}>{brand.name.charAt(0)}</span>}
              </Link>
              <div className={styles.body}>
                <h3>
                  <Link href={brand.href}>{brand.name}</Link>
                </h3>
                <p className={styles.text}>Усі моделі бренду, які можна замовити цього тижня.</p>
                <Link href={brand.href} className={styles.link}>
                  Дивитися моделі <ArrowRightIcon />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
