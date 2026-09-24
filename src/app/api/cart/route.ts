import type { CartItem } from "@/lib/cart-item";
import { getStoreProductBySku } from "@/lib/crm/catalog";
import { allowRequest, clientKey } from "@/lib/rate-limit";

const UNAVAILABLE = ["out_of_stock", "discontinued"];

/** Попередня звірка кошика. Кешований зріз каталогу тут доречний — це ще не замовлення. */
export async function POST(request: Request) {
  if (!allowRequest(`cart:${clientKey(request)}`, 60)) {
    return Response.json({ error: "Забагато запитів. Спробуйте за хвилину." }, { status: 429 });
  }
  try {
    const body = await request.json() as { items?: { sku?: unknown; quantity?: unknown }[] };
    if (!Array.isArray(body.items) || body.items.length > 100) {
      return Response.json({ error: "Некоректний кошик." }, { status: 400 });
    }
    const normalized = body.items.map((line) => ({
      sku: typeof line.sku === "string" ? line.sku.slice(0, 120) : "",
      requested: Number(line.quantity),
    }));
    const uniqueSkus = [...new Set(normalized.flatMap((line) => line.sku ? [line.sku] : []))];
    const products = new Map(
      (await Promise.all(uniqueSkus.map(async (sku) => [sku, await getStoreProductBySku(sku)] as const)))
        .filter((entry): entry is readonly [string, NonNullable<(typeof entry)[1]>] => entry[1] !== null),
    );
    const items: CartItem[] = normalized.flatMap(({ sku, requested }) => {
      const product = products.get(sku);
      if (
        !product || !sku
        || product.price === null
        || product.currency !== "UAH"
        || product.status !== "active"
        || UNAVAILABLE.includes(product.availability)
      ) return [];

      const available = product.stock === null ? 99 : Math.max(0, product.stock);
      const quantity = Math.min(Number.isInteger(requested) ? Math.max(1, requested) : 1, available, 99);
      if (!quantity) return [];

      const key = product.productGroupId ?? product.id;
      return [{
        productId: product.id,
        sku,
        name: product.name,
        image: product.images[0]?.url ?? null,
        price: product.price,
        currency: product.currency,
        color: product.color,
        size: product.size,
        quantity,
        href: `/product/${encodeURIComponent(key)}`,
        maxQuantity: product.stock,
      }];
    });
    return Response.json({ items });
  } catch {
    return Response.json({ error: "Не вдалося перевірити кошик." }, { status: 400 });
  }
}
