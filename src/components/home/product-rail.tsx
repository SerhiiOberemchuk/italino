import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { ProductCard as ProductCardModel } from "@/lib/catalog/product-cards";
import styles from "./product-rail.module.css";

type Props = {
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
  products: ProductCardModel[];
};

export function ProductRail({ eyebrow, title, href, linkLabel, products }: Props) {
  const headingId = `rail-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section className={`wrap ${styles.section}`} aria-labelledby={headingId}>
      <div className="section-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={headingId} className="section-title">
            {title}
          </h2>
        </div>
        <Link href={href} className="btn btn--ghost">
          {linkLabel} <ArrowRightIcon />
        </Link>
      </div>

      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
