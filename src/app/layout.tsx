import type { Metadata, Viewport } from "next";
import { Onest, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import { connection } from "next/server";
// Глобальні стилі — до компонентів: їхні CSS-модулі мають перекривати глобальні.
import "./globals.css";
import Script from "next/script";
import { Analytics } from "@/components/analytics/analytics";
import { CONSENT_DEFAULTS_SCRIPT } from "@/components/analytics/consent-defaults";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { StoreHydrator } from "@/components/store-hydrator";
import { publicSiteUrl } from "@/lib/site-url";
import { STORE } from "@/lib/store";
import { usedCategories } from "@/lib/catalog/categories";
import { getStoreCategories, getStoreProducts } from "@/lib/crm/catalog";
import type { CrmCategory } from "@/lib/crm/types";

// Display: високий контраст штрихів у дусі італійських дідонів (Bodoni), з повною українською кирилицею.
const display = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

// Body/UI: нейтральний сучасний гротеск, не сперечається із заголовками.
const body = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-onest",
  display: "swap",
});

const siteUrl = publicSiteUrl();

const storeJsonLd = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: STORE.name,
  url: siteUrl.toString(),
  logo: new URL("/logo.png", siteUrl).toString(),
  legalName: STORE.legalName,
  taxID: STORE.taxId,
  email: STORE.email,
  telephone: STORE.phone,
  paymentAccepted: "Visa, Mastercard, ПРОСТІР, Apple Pay, Google Pay",
  address: {
    "@type": "PostalAddress",
    streetAddress: "вул. Миру, будинок 2",
    addressLocality: "село Сатиїв",
    addressRegion: "Рівненська область",
    postalCode: "35610",
    addressCountry: "UA",
  },
};

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Italino — сумки, пляшки, одяг і подарунки на щодень",
    template: "%s · Italino",
  },
  description:
    "Рюкзаки й шопери, термопляшки та кухлі, базовий одяг, канцелярія й техніка від Italino. Замовляйте онлайн — щотижня організовуємо доставку замовлень в Україну.",
  openGraph: {
    type: "website",
    locale: "uk_UA",
    siteName: "Italino",
  },
};

// Сайт має лише світлу тему. Явний color-scheme блокує автоматичне
// «затемнення» сторінки браузером (Auto Dark Mode у Chrome/Edge).
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#fff7ee",
};

async function loadNavigationCategories(): Promise<CrmCategory[]> {
  try {
    const [categories, products] = await Promise.all([getStoreCategories(), getStoreProducts()]);
    return usedCategories(categories, products);
  } catch (error) {
    console.error("[CRM navigation]", error instanceof Error ? error.message : "Unknown error");
    return [];
  }
}

async function LiveSiteHeader() {
  await connection();
  const categories = await loadNavigationCategories();
  return <SiteHeader categories={categories} />;
}

async function LiveSiteFooter() {
  await connection();
  const categories = await loadNavigationCategories();
  return <SiteFooter categories={categories} />;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk" className={`${display.variable} ${body.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd).replace(/</g, "\\u003c") }} />
        <StoreHydrator />
        {/* Згода Google — до gtag('config'), тому beforeInteractive. */}
        <Script id="ga-consent-default" strategy="beforeInteractive">{CONSENT_DEFAULTS_SCRIPT}</Script>
        <Analytics host={publicSiteUrl().hostname.replace(/^www\./, "")} />
        <AnnouncementBar />
        <Suspense fallback={<SiteHeader categories={[]} />}>
          <LiveSiteHeader />
        </Suspense>
        {children}
        <Suspense fallback={<SiteFooter categories={[]} />}>
          <LiveSiteFooter />
        </Suspense>
      </body>
    </html>
  );
}
