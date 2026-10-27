import type { CartItem } from "@/lib/cart-item";
export const CHECKOUT_ATTEMPT_KEY = "italino-checkout-attempt-v1";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function cartFingerprint(items: Pick<CartItem, "sku" | "quantity" | "price" | "currency">[]): string {
  return JSON.stringify(items.map(({ sku, quantity, price, currency }) => ({ sku, quantity, price, currency })));
}
export function checkoutAttempt(fingerprint: string): string {
  try {
    const stored = JSON.parse(sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY) ?? "null") as { id?: unknown; fingerprint?: unknown } | null;
    const id = stored?.fingerprint === fingerprint && typeof stored.id === "string" && UUID.test(stored.id)
      ? stored.id : crypto.randomUUID();
    sessionStorage.setItem(CHECKOUT_ATTEMPT_KEY, JSON.stringify({ id, fingerprint }));
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
