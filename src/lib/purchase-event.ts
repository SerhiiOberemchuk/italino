import type { StoreOrderStatus } from "@/lib/crm/orders";

type StorageLike = Pick<Storage, "getItem" | "setItem">;
type PurchaseParams = Record<string, string | number | Record<string, string | number>[]>;
type ConversionParams = { transaction_id: string; value: number; currency: string };

export const PURCHASE_SENT_PREFIX = "italino:purchase:";

/**
 * Спільна основа GA4 `purchase` і конверсії Google Ads. `totalAmount` — сума
 * товарів: доставку Новою Поштою покупець оплачує при отриманні, у замовлення
 * вона не входить.
 */
function transactionParams(order: StoreOrderStatus): ConversionParams {
  return { transaction_id: order.orderId, value: Number(order.totalAmount), currency: "UAH" };
}

/**
 * Параметри GA4 `purchase`. `item_id` — id товару CRM (саме його Google
 * Merchant отримує як offerId); рядок замовлення без `productId` не вигадуємо.
 */
export function purchaseParams(order: StoreOrderStatus): PurchaseParams {
  const items = order.items.flatMap((item) => item.productId && item.quantity > 0
    ? [{ item_id: item.productId, item_name: item.name, price: item.total / item.quantity, quantity: item.quantity }]
    : []);
  return { ...transactionParams(order), ...(items.length ? { items } : {}) };
}

/**
 * Надсилає `purchase` і конверсію Google Ads лише для сплаченого замовлення й
 * лише раз на transaction_id: позначка лежить у localStorage, тож оновлення
 * сторінки чи нова вкладка їх не повторюють. Позначку ставимо тільки після того,
 * як подія справді пішла (`track` повертає false, поки GA не завантажився).
 */
export function trackPurchaseOnce(
  order: StoreOrderStatus,
  storage: StorageLike | null,
  track: (name: string, params: PurchaseParams) => boolean,
  trackConversion: (params: ConversionParams) => void,
): boolean {
  if (order.paymentStatus !== "paid" || order.currency !== "UAH") return false;
  const key = `${PURCHASE_SENT_PREFIX}${order.orderId}`;
  try {
    if (storage?.getItem(key)) return false;
  } catch {
    // Без сховища захищатися від повтору нічим; краще один зайвий раз, ніж жодного.
  }
  if (!track("purchase", purchaseParams(order))) return false;
  trackConversion(transactionParams(order));
  try {
    storage?.setItem(key, "1");
  } catch {
    // див. вище
  }
  return true;
}
