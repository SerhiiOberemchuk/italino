import type { Metadata, Viewport } from "next";
import { Onest, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { STORE } from "@/lib/store";

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const storeJsonLd = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: STORE.name,
  url: siteUrl,
  legalName: STORE.legalName,
  taxID: STORE.taxId,
  email: STORE.email,
  telephone: STORE.phone,
  paymentAccepted: "Visa, Mastercard, Apple Pay, Google Pay",
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
  metadataBase: new URL(siteUrl),
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk" className={`${display.variable} ${body.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd).replace(/</g, "\\u003c") }} />
        <AnnouncementBar />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
