import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, SparklesIcon } from "@/components/ui/icons";
import { heroShowcase } from "@/lib/mock/home";
import styles from "./hero.module.css";

const TINT_CLASS: Record<string, string> = {
  lime: styles.tintLime,
  sky: styles.tintSky,
  tomato: styles.tintTomato,
  mint: styles.tintMint,
};

export function Hero() {
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
            Сумки, пляшки, одяг і подарунки — <em>на щодень</em>.
          </h1>
          <p className={styles.lead}>
            Каталог італійського постачальника Sipec: рюкзаки й шопери,
            термопляшки та кухлі, базовий одяг, кепки, канцелярія й техніка.
            Понад 450 позицій — з переробленої або органічної сировини.
          </p>
          <div className={styles.ctas}>
            <Link href="/catalog" className="btn btn--primary">
              Дивитися каталог <ArrowRightIcon />
            </Link>
            <Link href="/business" className="btn btn--ghost">
              Для бізнесу
            </Link>
          </div>
          <dl className={styles.stats}>
            <div>
              <dt>Асортимент</dt>
              <dd>1 300+ моделей</dd>
            </div>
            <div>
              <dt>Сталі матеріали</dt>
              <dd>450+ позицій</dd>
            </div>
            <div>
              <dt>Замовлення</dt>
              <dd>від 1 штуки</dd>
            </div>
          </dl>
        </div>

        <ul className={styles.showcase}>
          {heroShowcase.map((item, index) => (
            <li key={item.href} className={`${styles.tile} ${TINT_CLASS[item.tint]}`}>
              <Link href={item.href} className={styles.tileLink}>
                <span className={styles.tileImg}>
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    priority={index < 2}
                    sizes="(min-width: 1024px) 22vw, 45vw"
                  />
                </span>
                <span className={styles.tileLabel}>
                  {item.label}
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
