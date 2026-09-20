import { ProductCard } from "@/components/catalog/product-card";
import { CustomSelect } from "@/components/ui/custom-select";
import { toProductCards } from "@/lib/catalog/product-cards";
import { getStoreProducts } from "@/lib/crm/catalog";
import styles from "../shop.module.css";

const CATEGORY_TERMS: Record<string, string[]> = {
  bags: ["рюкзак", "сумк"], drinkware: ["пляш", "кухл", "термо"],
  clothing: ["одяг", "худі", "футбол", "поло"], hats: ["кеп", "шап"],
  office: ["офіс", "канцел"], tech: ["технік", "електрон"],
  home: ["дім", "кухн"], travel: ["подорож", "спорт", "рюкзак"],
};

export async function CatalogContent({ searchParams, category }: { searchParams: Promise<Record<string, string | string[] | undefined>>; category?: string }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().toLocaleLowerCase("uk") : "";
  const brand = typeof params.brand === "string" ? params.brand : "";
  const sort = typeof params.sort === "string" ? params.sort : "newest";
  const discounted = params.discounted === "true";
  const all = await getStoreProducts();
  const brands = [...new Set(all.flatMap((p) => p.brand?.name ? [p.brand.name] : []))].sort();
  const terms = category ? CATEGORY_TERMS[category] ?? [category.toLocaleLowerCase("uk")] : [];
  const filtered = all.filter((p) => {
    const haystack = `${p.name} ${p.sku ?? ""} ${p.brand?.name ?? ""} ${p.category?.name ?? ""}`.toLocaleLowerCase("uk");
    return (!query || haystack.includes(query)) && (!brand || p.brand?.name === brand) && (!discounted || (p.compareAtPrice ?? 0) > (p.price ?? Infinity)) && (!terms.length || terms.some((term) => haystack.includes(term)));
  });
  const cards = toProductCards(filtered).sort((a, b) => sort === "price_asc" ? (a.price ?? Infinity) - (b.price ?? Infinity) : sort === "price_desc" ? (b.price ?? -Infinity) - (a.price ?? -Infinity) : 0);
  return (
    <div className={styles.catalogLayout}>
      <form className={styles.filters} id="catalog-filters">
        <label>Пошук<input className={styles.input} type="search" name="q" defaultValue={query} placeholder="Назва або артикул" /></label>
        <CustomSelect label="Бренд" name="brand" value={brand} options={[{ value: "", label: "Усі бренди" }, ...brands.map((name) => ({ value: name, label: name }))]} />
        <CustomSelect label="Сортування" name="sort" value={sort} options={[{ value: "newest", label: "Новинки" }, { value: "price_asc", label: "Ціна: від нижчої" }, { value: "price_desc", label: "Ціна: від вищої" }]} />
        {discounted ? <input type="hidden" name="discounted" value="true" /> : null}
        <button className={styles.primary} type="submit">Застосувати</button>
      </form>
      <section aria-label="Товари"><p className="section-lead">Знайдено моделей: {cards.length}</p>{cards.length ? <div className={styles.grid}>{cards.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className={styles.empty}>За цими параметрами товарів немає.</p>}</section>
    </div>
  );
}
