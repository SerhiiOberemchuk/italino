/**
 * Рядок кошика. Спільна форма для клієнтського стору (`@/lib/cart`) і для
 * серверної звірки (`/api/cart`), щоб відповідь роута не розповзалася з тим,
 * що зберігає браузер.
 */
export type CartItem = {
  productId: string;
  sku: string;
  name: string;
  image: string | null;
  price: number;
  currency: string;
  color: string | null;
  size: string | null;
  quantity: number;
  href?: string;
  maxQuantity?: number | null;
};

/** Рядки, що пережили збереження в localStorage або прийшли з `/api/cart`. */
export function validCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is CartItem => {
    const candidate = item as Partial<CartItem>;
    return typeof candidate.sku === "string"
      && typeof candidate.name === "string"
      && typeof candidate.price === "number"
      && typeof candidate.quantity === "number"
      && candidate.quantity > 0;
  });
}
