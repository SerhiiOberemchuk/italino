import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, SparklesIcon } from "@/components/ui/icons";
import type { CategoryTint, HomeCategory } from "@/lib/catalog/categories";
import { SCHEDULE_COPY } from "@/lib/shipping/schedule";
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
  /** Моделей у каталозі; `null` — CRM ще не віддає цю кількість. */
  modelCount: number | null;
};

function modelsLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} модель`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} моделі`;
  return `${count} моделей`;
}

export function Hero({ showcase, modelCount }: Props) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.blobLime} aria-hidden="true" />
      <div className={styles.blobTomato} aria-hidden="true" />

      <div className={`wrap ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={styles.pill}>
            <SparklesIcon /> Щотижнева поставка з Мілана
          </p>
          <h1 id="hero-title" className={styles.title}>
            Речі, які працюють <em>щодня</em>.
          </h1>
          <p className={styles.lead}>
            Практичні речі на кожен день з доставкою по всій Україні. Ви замовляєте онлайн — ми
            щотижня привозимо ваше замовлення зі складу в Мілані. Ціни в гривнях, від однієї штуки.
          </p>
          <div className={styles.ctas}>
            <Link href="/catalog" className="btn btn--primary">
              Обрати в каталозі <ArrowRightIcon />
            </Link>
            <Link href="/contacts" className="btn btn--ghost">
              Для бізнесу
            </Link>
          </div>
          <dl className={styles.stats}>
            {modelCount ? (
              <div>
                <dt>У каталозі</dt>
                <dd>{modelsLabel(modelCount)}</dd>
              </div>
            ) : null}
            <div>
              <dt>Відправка</dt>
              <dd>{SCHEDULE_COPY.dispatchEvery[0].toUpperCase() + SCHEDULE_COPY.dispatchEvery.slice(1)}</dd>
            </div>
            <div>
              <dt>Повернення</dt>
              <dd>14 днів</dd>
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
                <span className={styles.tileLabel}>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
