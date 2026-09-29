import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categoryKey, findCategory } from "@/lib/catalog/categories";
import { getStoreCategories } from "@/lib/crm/catalog";
import { CatalogResults, CatalogResultsSlot } from "../catalog-results";

export async function generateMetadata({ params }: PageProps<"/catalog/[category]">): Promise<Metadata> {
  const { category: key } = await params;
  const category = findCategory(await getStoreCategories(), key);
  if (!category) return {};
  return {
    title: category.name,
    description: `${category.name}: актуальні ціни й наявність зі складу ITALINO.`,
  };
}

async function CategoryResults({ params, searchParams }: PageProps<"/catalog/[category]">) {
  const [{ category: key }, query] = await Promise.all([params, searchParams]);
  const category = findCategory(await getStoreCategories(), key);
  if (!category) notFound();

  return (
    <CatalogResults
      params={query}
      category={category}
      basePath={`/catalog/${encodeURIComponent(categoryKey(category))}`}
    />
  );
}

/** Шапка з назвою категорії й фільтри — у `../layout.tsx`; тут лише результати. */
export default function CategoryPage(props: PageProps<"/catalog/[category]">) {
  return (
    <CatalogResultsSlot>
      <CategoryResults {...props} />
    </CatalogResultsSlot>
  );
}
