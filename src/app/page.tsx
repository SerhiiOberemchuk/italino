import { BrandStrip } from "@/components/home/brand-strip";
import { CategoryTiles } from "@/components/home/category-tiles";
import { DispatchBanner } from "@/components/home/dispatch-banner";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { Newsletter } from "@/components/home/newsletter";
import { ProductRail } from "@/components/home/product-rail";
import { PromoSplit } from "@/components/home/promo-split";
import { WhyItalino } from "@/components/home/why-italino";
import { catalogBrands } from "@/lib/catalog/brands";
import { homeCategories, type HomeCategory, usedCategoriesByIds } from "@/lib/catalog/categories";
import { saleCard } from "@/lib/catalog/catalog-index";
import { getStoreCatalog, getStoreCategories } from "@/lib/crm/catalog";
import { connection } from "next/server";

function reportCrmError(scope: string, error: unknown) {
  console.error(scope, error instanceof Error ? error.message : "Unknown error");
}

export default async function HomePage() {
  await connection();
  const [categoryResult, catalogResult] = await Promise.allSettled([
    getStoreCategories(),
    getStoreCatalog(),
  ]);
  if (categoryResult.status === "rejected") reportCrmError("[CRM categories]", categoryResult.reason);
  if (catalogResult.status === "rejected") reportCrmError("[CRM catalog]", catalogResult.reason);

  const categories = categoryResult.status === "fulfilled" ? categoryResult.value : [];
  const catalog = catalogResult.status === "fulfilled"
    ? catalogResult.value
    : { models: [], productCount: 0 };
  const productCards = catalog.models;
  const visibleCategories = usedCategoriesByIds(
    categories,
    productCards.flatMap((model) => model.categoryIds),
  );
  const categoryCards = homeCategories(visibleCategories, productCards);
  const brands = catalogBrands(productCards);
  const showcase = categoryCards.filter(
    (category): category is HomeCategory & { image: string } => category.image !== null,
  );
  const saleImage = productCards.find((model) => model.image && model.salePrice !== null)?.image ?? null;
  const businessImage = productCards.find((model) => model.image && model.image !== saleImage)?.image ?? null;
  // Відсоток у банері Sale — лише реальна найбільша знижка з каталогу, не маркетингова обіцянка.
  const maxDiscount = Math.max(0, ...productCards.map((model) => saleCard(model).discountPercent ?? 0)) || null;

  return (
    <main>
      {/* Спершу асортимент: hero → категорії → товари → бренди. Доставку пояснюємо нижче. */}
      <Hero showcase={showcase} modelCount={productCards.length} />
      <CategoryTiles categories={categoryCards} />
      <ProductRail
        eyebrow="Новинки"
        title="Щойно в каталозі"
        href="/catalog?sort=newest"
        linkLabel="Усі новинки"
        products={productCards.slice(0, 8)}
        emptyMessage={catalogResult.status === "rejected"
          ? "Не вдалося завантажити товари. Будь ласка, спробуйте пізніше."
          : "Незабаром тут з’являться товари."
        }
      />
      <BrandStrip brands={brands} />
      <PromoSplit saleImage={saleImage} businessImage={businessImage} maxDiscount={maxDiscount} />
      <DispatchBanner />
      <HowItWorks />
      <WhyItalino />
      <Newsletter />
    </main>
  );
}
