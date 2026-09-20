export const CART_STORAGE_KEY = "italino-cart-v1";
export const CART_EVENT = "italino-cart-change";

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

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is CartItem => {
      const candidate = item as Partial<CartItem>;
      return typeof candidate.sku === "string" && typeof candidate.quantity === "number";
    });
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function addCartItem(item: CartItem) {
  const cart = readCart();
  const existing = cart.find((line) => line.sku === item.sku);
  const limit = item.maxQuantity ?? 99;
  if (existing) {
    existing.quantity = Math.min(limit, existing.quantity + item.quantity);
    existing.href = item.href;
    existing.maxQuantity = item.maxQuantity;
  }
  else cart.push(item);
  writeCart(cart);
}
