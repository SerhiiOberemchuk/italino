import { BrandStrip } from "@/components/home/brand-strip";
import { CategoryTiles } from "@/components/home/category-tiles";
import { DispatchBanner } from "@/components/home/dispatch-banner";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { Newsletter } from "@/components/home/newsletter";
import { ProductRail } from "@/components/home/product-rail";
import { PromoSplit } from "@/components/home/promo-split";
import { WhyItalino } from "@/components/home/why-italino";
import { brandLinks } from "@/lib/catalog/brands";
import { homeCategories, type HomeCategory } from "@/lib/catalog/categories";
import { catalogQuery, getCatalogPage, getStoreBrands, getStoreCategories } from "@/lib/crm/catalog";
import { connection } from "next/server";

function reportCrmError(scope: string, error: unknown) {
  console.error(scope, error instanceof Error ? error.message : "Unknown error");
}

export default async function HomePage() {
  await connection();
  // Товари головної — це перша сторінка каталогу (той самий запис кешу, що й /catalog),
  // а не окреме завантаження.
  const [categoryResult, brandResult, catalogResult] = await Promise.allSettled([
    getStoreCategories(),
    getStoreBrands(),
    getCatalogPage(catalogQuery()),
  ]);
  if (categoryResult.status === "rejected") reportCrmError("[CRM categories]", categoryResult.reason);
  if (brandResult.status === "rejected") reportCrmError("[CRM brands]", brandResult.reason);
  if (catalogResult.status === "rejected") reportCrmError("[CRM catalog]", catalogResult.reason);

  const categories = categoryResult.status === "fulfilled" ? categoryResult.value : [];
  const brands = brandResult.status === "fulfilled" ? brandLinks(brandResult.value) : [];
  const catalog = catalogResult.status === "fulfilled" ? catalogResult.value : null;
  const productCards = catalog?.cards ?? [];
  const categoryCards = homeCategories(categories, productCards);
  const showcase = categoryCards.filter(
    (category): category is HomeCategory & { image: string } => category.image !== null,
  );
  const saleImage = productCards.find((card) => card.image && card.discountPercent)?.image ?? null;
  const businessImage = productCards.find((card) => card.image && card.image !== saleImage)?.image ?? null;

  return (
    <main>
      {/* Спершу асортимент: hero → категорії → товари → бренди. Доставку пояснюємо нижче. */}
      <Hero showcase={showcase} modelCount={catalog?.modelCount ?? null} />
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
      {/* Найбільшу знижку не рахуємо: для цього довелося б читати весь склад. */}
      <PromoSplit saleImage={saleImage} businessImage={businessImage} maxDiscount={null} />
      <DispatchBanner />
      <HowItWorks />
      <WhyItalino />
      <Newsletter />
    </main>
  );
}
