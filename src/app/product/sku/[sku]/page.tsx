import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPageContent } from "@/components/catalog/product-page-content";
import { getStoreProductBySku } from "@/lib/crm/catalog";

export async function generateMetadata({ params }: PageProps<"/product/sku/[sku]">): Promise<Metadata> {
  const { sku } = await params;
  const product = await getStoreProductBySku(sku);
  const variantLabel = [product?.color, product?.size].filter(Boolean).join(" · ");
  return product ? {
    title: variantLabel ? `${product.name} — ${variantLabel}` : product.name,
    description: product.description?.slice(0, 155),
    alternates: { canonical: `/product/sku/${encodeURIComponent(sku)}` },
    ...(product.images[0]?.url ? { openGraph: { images: [product.images[0].url] } } : {}),
  } : { title: "Товар" };
}

async function loadSku(params: PageProps<"/product/sku/[sku]">["params"]) {
  const { sku } = await params;
  const product = await getStoreProductBySku(sku);
  if (!product) notFound();
  return [product];
}

export default function SkuProductPage({ params }: PageProps<"/product/sku/[sku]">) {
  return <ProductPageContent variants={loadSku(params)} skuPage />;
}
