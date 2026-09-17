import { BrandStrip } from "@/components/home/brand-strip";
import { CategoryTiles } from "@/components/home/category-tiles";
import { DispatchBanner } from "@/components/home/dispatch-banner";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { Newsletter } from "@/components/home/newsletter";
import { ProductRail } from "@/components/home/product-rail";
import { PromoSplit } from "@/components/home/promo-split";
import { WhyItalino } from "@/components/home/why-italino";
import { toProductCards } from "@/lib/catalog/product-cards";
import { homeBrands, homeCategories, homeProducts } from "@/lib/mock/home";

export default function HomePage() {
  // Мок-дані у формі відповіді Obriym CRM; після підключення API — заміна на реальний запит.
  const newArrivals = toProductCards(homeProducts);

  return (
    <main>
      {/* Спершу асортимент: hero → категорії → товари → бренди. Доставку пояснюємо нижче. */}
      <Hero />
      <CategoryTiles categories={homeCategories} />
      <ProductRail
        eyebrow="Щойно в каталозі"
        title="Нові надходження"
        href="/catalog?sort=new"
        linkLabel="Усі новинки"
        products={newArrivals}
      />
      <BrandStrip brands={homeBrands} />
      <PromoSplit />
      <DispatchBanner />
      <HowItWorks />
      <WhyItalino />
      <Newsletter />
    </main>
  );
}
