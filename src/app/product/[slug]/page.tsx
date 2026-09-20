import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BuyBox } from "@/components/catalog/buy-box";
import { getProductVariants, getStoreProducts } from "@/lib/crm/catalog";
import styles from "../../shop.module.css";

function externalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function attributeLinkLabel(name: string): string {
  return name.toLocaleLowerCase("uk").includes("техніч") ? "Технічний лист" : "Відкрити посилання";
}

export async function generateStaticParams() {
  try { return (await getStoreProducts()).map((p) => ({ slug: p.productGroupId ?? p.id })); } catch { return []; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getProductVariants(slug))[0];
  return product ? { title: product.name, description: product.description?.slice(0, 155) } : { title: "Товар" };
}

async function ProductContent({ slug }: { slug: string }) {
  const variants = await getProductVariants(slug);
  if (!variants.length) notFound();
  const lead = variants[0];
  const images = [...new Set(variants.flatMap((p) => p.images.map((image) => image.url)))];
  const attributes = lead.attributes ?? [];
  const jsonLd = { "@context": "https://schema.org", "@type": "Product", name: lead.name, image: images, description: lead.description, sku: lead.sku, brand: lead.brand?.name ? { "@type": "Brand", name: lead.brand.name } : undefined, offers: variants.filter((p) => p.price !== null).map((p) => ({ "@type": "Offer", priceCurrency: p.currency, price: p.price, availability: p.availability === "in_stock" ? "https://schema.org/InStock" : "https://schema.org/PreOrder" })) };
  return <>
    <nav className={styles.crumbs}><Link href="/">Головна</Link><span>/</span><Link href="/catalog">Каталог</Link><span>/</span><span>{lead.name}</span></nav>
    <div className={styles.product}>
      <div className={styles.gallery}>{images.map((src, index) => <div className={styles.galleryItem} key={src}><Image src={src} alt={`${lead.name}${index ? ` — фото ${index + 1}` : ""}`} fill sizes="(min-width: 1024px) 35vw, 50vw" priority={index === 0} /></div>)}</div>
      <section className={styles.details}><p className={styles.brand}>{lead.brand?.name}</p><h1>{lead.name}</h1><BuyBox variants={variants} /><div className={styles.infoBox}><strong>Найближча відправка — цієї неділі.</strong><br />Орієнтовна доставка в Україну: 5–9 днів після відправки.</div>{lead.description ? <p className={styles.description}>{lead.description}</p> : null}{attributes.length ? <table className={styles.specs}><tbody>{attributes.map((a) => { const url = externalUrl(a.value); return <tr key={`${a.name}-${a.value}`}><th>{a.name}</th><td>{url ? <a href={url} target="_blank" rel="noreferrer">{attributeLinkLabel(a.name)}</a> : <>{a.value}{a.unit ? ` ${a.unit}` : ""}</>}</td></tr>; })}</tbody></table> : null}</section>
    </div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
  </>;
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return <main className={`wrap ${styles.page}`}><Suspense fallback={<p className={styles.empty}>Завантажуємо товар…</p>}>{params.then(({ slug }) => <ProductContent slug={slug} />)}</Suspense></main>;
}
