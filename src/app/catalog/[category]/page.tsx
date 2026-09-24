import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CatalogContent } from "../catalog-content";
import { categoryBranchIds, findCategory, usedCategories } from "@/lib/catalog/categories";
import { getStoreCategories, getStoreProducts } from "@/lib/crm/catalog";
import styles from "../../shop.module.css";

async function CategoryCatalog({ params, searchParams }: PageProps<"/catalog/[category]">) {
  const { category: key } = await params;
  const [allCategories, products] = await Promise.all([getStoreCategories(), getStoreProducts()]);
  const categories = usedCategories(allCategories, products);
  const category = findCategory(categories, key);
  if (!category) notFound();

  const categoryIds = [...categoryBranchIds(categories, category.id)];
  return (
    <>
      <div className={styles.hero}>
        <div><p className="eyebrow">Каталог</p><h1>{category.name}</h1></div>
      </div>
      <CatalogContent
        searchParams={searchParams}
        categoryIds={categoryIds}
        basePath={`/catalog/${encodeURIComponent(key)}`}
        products={products}
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
