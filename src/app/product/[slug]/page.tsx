import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BuyBox } from "@/components/catalog/buy-box";
import { ProductGallery, ProductGallerySkeleton } from "@/components/catalog/product-gallery";
import { VariantSelectionProvider } from "@/components/catalog/variant-selection";
import { isPurchasable, variantAxes } from "@/lib/catalog/variants";
import type { CrmProduct } from "@/lib/crm/types";
import { getFreeShippingThreshold, getProductVariants } from "@/lib/crm/catalog";
import { SCHEDULE_COPY } from "@/lib/shipping/schedule";
import { NextDispatchDate } from "@/components/home/dispatch-clock";
import {
  BuyBoxSkeleton,
  ProductSpecsSkeleton,
  ProductTitleSkeleton,
} from "@/components/catalog/product-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { formatThreshold } from "@/lib/shipping/free-shipping";
import { offerPolicyReferences } from "@/lib/seo/merchant-policies";
import { publicSiteUrl } from "@/lib/site-url";
import styles from "../../shop.module.css";

function externalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Наявність для Google — те саме правило, що й у кнопки «У кошик»: артикул,
 * який не можна купити, не видається за передзамовлення. Купити можна, але не
 * зі складу (під замовлення, передзамовлення) — PreOrder, як і було.
 */
function schemaAvailability(variant: CrmProduct): string {
  if (!isPurchasable(variant)) {
    return variant.availability === "discontinued" ? "https://schema.org/Discontinued" : "https://schema.org/OutOfStock";
  }
  return variant.availability === "in_stock" ? "https://schema.org/InStock" : "https://schema.org/PreOrder";
}

function attributeLinkLabel(name: string): string {
  return name.toLocaleLowerCase("uk").includes("техніч") ? "Технічний лист" : "Відкрити посилання";
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getProductVariants(slug))[0];
  return product ? { title: product.name, description: product.description?.slice(0, 155) } : { title: "Товар" };
}


type Variants = Promise<CrmProduct[]>;

/** Варіанти моделі за адресою. Невідома модель — 404 для всіх, хто чекає на проміс. */
async function loadVariants(params: PageProps<"/product/[slug]">["params"]): Promise<CrmProduct[]> {
  const { slug } = await params;
  const variants = await getProductVariants(slug);
  if (!variants.length) notFound();
  return variants;
}

async function ProductCrumb({ variants }: { variants: Variants }) {
  return <span>{(await variants)[0].name}</span>;
}

async function ProductTitle({ variants }: { variants: Variants }) {
  const lead = (await variants)[0];
  return (
    <>
      <p className={styles.brand}>{lead.brand?.name}</p>
      <h1>{lead.name}</h1>
    </>
  );
}

async function ProductSpecs({ variants }: { variants: Variants }) {
  const lead = (await variants)[0];
  const attributes = lead.attributes ?? [];
  return (
    <>
      {lead.description ? <p className={styles.description}>{lead.description}</p> : null}
      {attributes.length ? (
        <table className={styles.specs}>
          <tbody>
            {attributes.map((a) => {
              const url = externalUrl(a.value);
              return (
                <tr key={`${a.name}-${a.value}`}>
                  <th>{a.name}</th>
                  <td>
                    {url
                      ? <a href={url} target="_blank" rel="noreferrer">{attributeLinkLabel(a.name)}</a>
                      : <>{a.value}{a.unit ? ` ${a.unit}` : ""}</>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
    </>
  );
}

/** Поріг з кешу CRM — частина статичної оболонки, як і решта блоку доставки. */
async function FreeShippingNote() {
  const freeFrom = await getFreeShippingThreshold();
  return freeFrom !== null ? <><br />Доставка безкоштовна для замовлень від {formatThreshold(freeFrom)}.</> : null;
}

async function ProductJsonLd({ variants: variantsPromise }: { variants: Variants }) {
  const variants = await variantsPromise;
  const lead = variants[0];
  const axes = variantAxes(variants);
  const offerPolicies = offerPolicyReferences(publicSiteUrl());

  // ProductGroup, а не Product: модель — це кілька офіційних артикулів
  // (`hasVariant`), і саме так CRM зберігає її — один рядок на «колір × розмір».
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    name: lead.name,
    description: lead.description,
    productGroupID: lead.productGroupId ?? lead.id,
    brand: lead.brand?.name ? { "@type": "Brand", name: lead.brand.name } : undefined,
    variesBy: [
      ...(axes.colors.length > 0 ? ["https://schema.org/color"] : []),
      ...(axes.hasSizes ? ["https://schema.org/size"] : []),
    ],
    hasVariant: variants.map((variant) => ({
      "@type": "Product",
      name: variant.name,
      sku: variant.sku ?? undefined,
      color: variant.color ?? undefined,
      size: variant.size ?? undefined,
      image: variant.images.map((image) => image.url),
      offers: variant.price === null ? undefined : {
        "@type": "Offer",
        priceCurrency: variant.currency,
        price: variant.price,
        availability: schemaAvailability(variant),
        ...offerPolicies,
      },
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }} />;
}

/**
 * Структура сторінки — крихти, сітка, блок доставки — віддається одразу.
 * Усе, що залежить від моделі, чекає на спільний проміс варіантів у власному
 * `<Suspense>` зі скелетоном тієї самої геометрії.
 */
export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const variants = loadVariants(params);

  return (
    <main className={`wrap ${styles.page}`}>
      <nav className={styles.crumbs}>
        <Link href="/">Головна</Link><span>/</span>
        <Link href="/catalog">Каталог</Link><span>/</span>
        <Suspense fallback={<Skeleton width="16em" />}>
          <ProductCrumb variants={variants} />
        </Suspense>
      </nav>

      <VariantSelectionProvider variants={variants}>
        <div className={styles.product}>
          <Suspense fallback={<ProductGallerySkeleton />}>
            <ProductGallery />
          </Suspense>

          <section className={styles.details}>
            <Suspense fallback={<ProductTitleSkeleton />}>
              <ProductTitle variants={variants} />
            </Suspense>
            <Suspense fallback={<BuyBoxSkeleton />}>
              <BuyBox />
            </Suspense>
            <div className={styles.infoBox}>
              <strong>Найближча відправка — <NextDispatchDate fallback={SCHEDULE_COPY.dispatchOn} />.</strong><br />
              Отримання Новою Поштою — {SCHEDULE_COPY.transit} після відправки, зазвичай {SCHEDULE_COPY.arrivalOn}.
              <FreeShippingNote />
            </div>
            <Suspense fallback={<ProductSpecsSkeleton />}>
              <ProductSpecs variants={variants} />
            </Suspense>
          </section>
        </div>
      </VariantSelectionProvider>

      <Suspense fallback={null}>
        <ProductJsonLd variants={variants} />
      </Suspense>
    </main>
  );
}
