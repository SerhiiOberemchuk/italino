import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { HomeBrand } from "@/lib/mock/home";
import styles from "./brand-strip.module.css";

export function BrandStrip({ brands }: { brands: HomeBrand[] }) {
  return (
    <section className={styles.section} aria-labelledby="brands-title">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="eyebrow">Бренди</p>
            <h2 id="brands-title" className="section-title">
              Три бренди в каталозі
            </h2>
            <p className="section-lead">
              Бренди, представлені в асортименті Italino. Їхні колекції Sustainable
              Living поєднують перероблені й органічні матеріали та сертифікації
              GRS і OceanCycle.
            </p>
          </div>
          <Link href="/catalog#catalog-filters" className="btn btn--ghost">
            Усі бренди
          </Link>
        </div>

        <ul className={styles.grid}>
          {brands.map((brand) => (
            <li key={brand.slug} className={styles.card}>
              <Link href={brand.href} className={styles.media} aria-label={brand.name}>
                <Image
                  src={brand.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                />
              </Link>
              <div className={styles.body}>
                <p className={styles.tagline}>{brand.tagline}</p>
                <h3>
                  <Link href={brand.href}>{brand.name}</Link>
                </h3>
                <p className={styles.text}>{brand.text}</p>
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
