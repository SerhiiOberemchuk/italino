import { getStoreProducts } from "@/lib/crm/catalog";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { items?: { sku?: unknown; quantity?: unknown }[] };
    if (!Array.isArray(body.items) || body.items.length > 100) return Response.json({ error: "Некоректний кошик." }, { status: 400 });
    const products = await getStoreProducts();
    const items = body.items.flatMap((line) => {
      const sku = typeof line.sku === "string" ? line.sku.slice(0, 120) : "";
      const requested = Number(line.quantity);
      const product = products.find((item) => item.sku === sku);
      if (!product || !sku || product.price === null || product.currency !== "UAH" || product.status !== "active" || ["out_of_stock", "discontinued"].includes(product.availability)) return [];
      const available = product.stock === null ? 99 : Math.max(0, product.stock);
      const quantity = Math.min(Number.isInteger(requested) ? Math.max(1, requested) : 1, available, 99);
      if (!quantity) return [];
      return [{ productId: product.id, sku, name: product.name, image: product.images[0]?.url ?? null, price: product.price, currency: product.currency, color: product.color, size: product.size, quantity }];
    });
    return Response.json({ items });
  } catch {
    return Response.json({ error: "Не вдалося перевірити кошик." }, { status: 400 });
  }
}
