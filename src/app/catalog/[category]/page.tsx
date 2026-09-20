import { Suspense } from "react";
import { CatalogContent } from "../catalog-content";
import styles from "../../shop.module.css";

const LABELS: Record<string, string> = { bags: "Сумки та рюкзаки", drinkware: "Пляшки та кухлі", clothing: "Одяг", hats: "Кепки та аксесуари", office: "Офіс і канцелярія", tech: "Техніка", home: "Дім і кухня", travel: "Подорожі та спорт" };

export default function CategoryPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <main className={`wrap ${styles.page}`}><Suspense fallback={<p className={styles.empty}>Завантажуємо…</p>}>{params.then(({ category }) => <><div className={styles.hero}><div><p className="eyebrow">Каталог</p><h1>{LABELS[category] ?? category}</h1></div></div><CatalogContent searchParams={searchParams} category={category} /></>)}</Suspense></main>;
}
