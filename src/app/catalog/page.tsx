import type { Metadata } from "next";
import { CatalogResults, CatalogResultsSlot, type CatalogSearchParams } from "./catalog-results";

export const metadata: Metadata = { title: "Каталог", description: "Товари зі складу ITALINO" };

async function Results({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  return <CatalogResults params={await searchParams} basePath="/catalog" />;
}

/** Шапка й фільтри — у `layout.tsx`; сторінка рендерить лише результати. */
export default function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  return (
    <CatalogResultsSlot>
      <Results searchParams={searchParams} />
    </CatalogResultsSlot>
  );
}
