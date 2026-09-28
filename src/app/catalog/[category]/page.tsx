import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CatalogContent } from "../catalog-content";
import { categoryKey, findCategory } from "@/lib/catalog/categories";
import { getStoreCategories } from "@/lib/crm/catalog";
import styles from "../../shop.module.css";

async function CategoryCatalog({ params, searchParams }: PageProps<"/catalog/[category]">) {
  const { category: key } = await params;
  const category = findCategory(await getStoreCategories(), key);
  if (!category) notFound();

  return (
    <>
      <div className={styles.hero}>
        <div><p className="eyebrow">Каталог</p><h1>{category.name}</h1></div>
      </div>
      <CatalogContent
        searchParams={searchParams}
        category={category}
        basePath={`/catalog/${encodeURIComponent(categoryKey(category))}`}
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
