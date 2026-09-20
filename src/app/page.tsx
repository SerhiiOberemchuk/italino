import { Suspense } from "react";
import { BrandStrip } from "@/components/home/brand-strip";
import { CategoryTiles } from "@/components/home/category-tiles";
import { DispatchBanner } from "@/components/home/dispatch-banner";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { Newsletter } from "@/components/home/newsletter";
import { ProductRail } from "@/components/home/product-rail";
import { LiveProducts } from "@/components/home/live-products";
import { PromoSplit } from "@/components/home/promo-split";
import { WhyItalino } from "@/components/home/why-italino";
import { homeBrands, homeCategories } from "@/lib/mock/home";

export default function HomePage() {
  return (
    <main>
      {/* Спершу асортимент: hero → категорії → товари → бренди. Доставку пояснюємо нижче. */}
      <Hero />
      <CategoryTiles categories={homeCategories} />
      <Suspense
        fallback={
          <ProductRail
            eyebrow="Щойно в каталозі"
            title="Нові надходження"
            href="/catalog?sort=newest"
            linkLabel="Усі новинки"
            products={[]}
            emptyMessage="Завантажуємо товари…"
          />
        }
      >
        <LiveProducts />
      </Suspense>
      <BrandStrip brands={homeBrands} />
      <PromoSplit />
      <DispatchBanner />
      <HowItWorks />
      <WhyItalino />
      <Newsletter />
    </main>
  );
}
