import { Suspense } from "react";
import { CatalogContent } from "../catalog-content";
import styles from "../../shop.module.css";

const LABELS: Record<string, string> = {
  bags: "Сумки та рюкзаки", drinkware: "Пляшки та кухлі", clothing: "Одяг",
  hats: "Кепки та аксесуари", office: "Офіс і канцелярія", tech: "Техніка",
  home: "Дім і кухня", travel: "Подорожі та спорт",
};

async function CategoryCatalog({ params, searchParams }: PageProps<"/catalog/[category]">) {
  const { category } = await params;
  return (
    <>
      <div className={styles.hero}>
        <div><p className="eyebrow">Каталог</p><h1>{LABELS[category] ?? category}</h1></div>
      </div>
      <CatalogContent
        searchParams={searchParams}
        category={category}
        basePath={`/catalog/${encodeURIComponent(category)}`}
      />
    </>
  );
}

export default function CategoryPage({ params, searchParams }: PageProps<"/catalog/[category]">) {
  return (
    <main className={`wrap ${styles.page}`}>
      <Suspense fallback={<p className={styles.empty}>Завантажуємо…</p>}>
        <CategoryCatalog params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
