import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { CatalogBrand } from "@/lib/catalog/brands";
import styles from "./brand-strip.module.css";

function modelLabel(count: number): string {
  const remainder100 = count % 100;
  const remainder10 = count % 10;
  if (remainder100 >= 11 && remainder100 <= 14) return `${count} моделей`;
  if (remainder10 === 1) return `${count} модель`;
  if (remainder10 >= 2 && remainder10 <= 4) return `${count} моделі`;
  return `${count} моделей`;
}

export function BrandStrip({ brands }: { brands: readonly CatalogBrand[] }) {
  if (!brands.length) return null;

  return (
    <section className={styles.section} aria-labelledby="brands-title">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="eyebrow">Бренди</p>
            <h2 id="brands-title" className="section-title">
              Бренди в актуальному каталозі
            </h2>
            <p className="section-lead">
              Тут показані лише бренди, товари яких зараз доступні на складі Italino.
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
                <p className={styles.tagline}>{modelLabel(brand.modelCount)}</p>
                <h3>
                  <Link href={brand.href}>{brand.name}</Link>
                </h3>
                <p className={styles.text}>Товари бренду в актуальному асортименті складу Italino.</p>
                <Link href={brand.href} className={styles.link}>
                  Дивитися бренд <ArrowRightIcon />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
