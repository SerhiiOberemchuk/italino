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
import { homeCategories, type HomeCategory, usedCategories } from "@/lib/catalog/categories";
import { toProductCards } from "@/lib/catalog/product-cards";
import { getStoreCategories, getStoreProducts } from "@/lib/crm/catalog";
import { connection } from "next/server";

function reportCrmError(scope: string, error: unknown) {
  console.error(scope, error instanceof Error ? error.message : "Unknown error");
}

export default async function HomePage() {
  await connection();
  const [categoryResult, productResult] = await Promise.allSettled([
    getStoreCategories(),
    getStoreProducts(),
  ]);
  if (categoryResult.status === "rejected") reportCrmError("[CRM categories]", categoryResult.reason);
  if (productResult.status === "rejected") reportCrmError("[CRM catalog]", productResult.reason);

  const categories = categoryResult.status === "fulfilled" ? categoryResult.value : [];
  const products = productResult.status === "fulfilled" ? productResult.value : [];
  const visibleCategories = usedCategories(categories, products);
  const categoryCards = homeCategories(visibleCategories, products);
  const brands = catalogBrands(products);
  const showcase = categoryCards.filter(
    (category): category is HomeCategory & { image: string } => category.image !== null,
  );
  const productCards = toProductCards(products);
  const saleImage = products.find((product) => (
    product.images[0]?.url && (product.compareAtPrice ?? 0) > (product.price ?? Infinity)
  ))?.images[0]?.url ?? null;
  const businessImage = products.find((product) => (
    product.images[0]?.url && product.images[0].url !== saleImage
  ))?.images[0]?.url ?? null;

  return (
    <main>
      {/* Спершу асортимент: hero → категорії → товари → бренди. Доставку пояснюємо нижче. */}
      <Hero
        showcase={showcase}
        categoryCount={visibleCategories.length}
        modelCount={productCards.length}
        productCount={products.length}
      />
      <CategoryTiles categories={categoryCards} />
      <ProductRail
        eyebrow="Щойно в каталозі"
        title="Нові надходження"
        href="/catalog?sort=newest"
        linkLabel="Усі новинки"
        products={productCards.slice(0, 8)}
        emptyMessage={productResult.status === "rejected"
          ? "Не вдалося завантажити товари. Будь ласка, спробуйте пізніше."
          : "Незабаром тут з’являться товари."
        }
      />
      <BrandStrip brands={brands} />
      <PromoSplit saleImage={saleImage} businessImage={businessImage} />
      <DispatchBanner />
      <HowItWorks />
      <WhyItalino />
      <Newsletter />
    </main>
  );
}
