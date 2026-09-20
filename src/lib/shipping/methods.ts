/**
 * Способи доставки, які пропонує вітрина.
 *
 * Перелік тримаємо тут, а не беремо з `GET /capabilities`, і на те дві причини.
 *
 * По-перше, CRM не звіряє `delivery.carrier` з capabilities: для неї це
 * зафіксований вибір покупця, а не відправка. Накладну менеджер створює
 * окремо, тож перевізника можна пропонувати ще до того, як у CRM підключено
 * його адаптер.
 *
 * По-друге, серед вбудованих методів CRM завжди є самовивіз — а Italino точки
 * видачі не має: товар іде зі складу в Мілані щотижневою поставкою. Пропонувати
 * покупцеві приїхати по замовлення було б неправдою.
 *
 * Оплата влаштована навпаки: там без підключеного адаптера списати гроші
 * неможливо, тому способи оплати беремо саме з capabilities.
 */
export const SHIPPING_METHODS = [
  {
    key: "nova_poshta",
    label: "Нова Пошта",
    hint: "Відділення або поштомат; доставка за тарифами перевізника",
    /** `branch` — відділення чи поштомат перевізника (див. ORDER_DELIVERY_METHODS у CRM). */
    method: "branch",
  },
] as const;

export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

export function shippingMethod(key: string): ShippingMethod | undefined {
  return SHIPPING_METHODS.find((method) => method.key === key);
}
