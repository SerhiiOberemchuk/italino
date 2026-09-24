import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CatalogContent } from "../catalog-content";
import { categoryBranchIds, findCategory, usedCategoriesByIds } from "@/lib/catalog/categories";
import { getStoreCatalog, getStoreCategories } from "@/lib/crm/catalog";
import styles from "../../shop.module.css";

async function CategoryCatalog({ params, searchParams }: PageProps<"/catalog/[category]">) {
  const { category: key } = await params;
  const [allCategories, catalog] = await Promise.all([getStoreCategories(), getStoreCatalog()]);
  const categories = usedCategoriesByIds(allCategories, catalog.models.flatMap((model) => model.categoryIds));
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
        catalog={catalog}
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
