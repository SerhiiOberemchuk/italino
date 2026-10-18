import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPageContent } from "@/components/catalog/product-page-content";
import { getProductVariants, getStoreProductBySku } from "@/lib/crm/catalog";

type ProductResult = { variants: Awaited<ReturnType<typeof getProductVariants>>; skuPage: boolean };

/** Model keys keep their current URLs. Only an unknown model key is tried as an exact SKU. */
async function resolveProduct(slug: string): Promise<ProductResult | null> {
  const variants = await getProductVariants(slug);
  if (variants.length) return { variants, skuPage: false };

  const product = await getStoreProductBySku(slug);
  return product ? { variants: [product], skuPage: true } : null;
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await resolveProduct(slug);
  const product = result?.variants[0];
  const variantLabel = result?.skuPage ? [product?.color, product?.size].filter(Boolean).join(" · ") : "";
  return product ? {
    title: variantLabel ? `${product.name} — ${variantLabel}` : product.name,
    description: product.description?.slice(0, 155),
    alternates: { canonical: result.skuPage ? `/product/sku/${encodeURIComponent(slug)}` : `/product/${encodeURIComponent(slug)}` },
    ...(result.skuPage && product.images[0]?.url ? { openGraph: { images: [product.images[0].url] } } : {}),
  } : { title: "Товар" };
}

async function loadProduct(params: PageProps<"/product/[slug]">["params"]): Promise<ProductResult> {
  const { slug } = await params;
  const result = await resolveProduct(slug);
  if (!result) notFound();
  return result;
}

export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const product = loadProduct(params);
  return (
    <ProductPageContent
      variants={product.then((result) => result.variants)}
      skuPage={product.then((result) => result.skuPage)}
    />
  );
}
