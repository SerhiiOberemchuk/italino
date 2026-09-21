import { formatPrice } from "@/lib/format";

/**
 * Безкоштовна доставка Новою Поштою від порогу.
 *
 * Поріг задається в Obriym CRM і приходить у `GET /capabilities` як
 * `cart.freeShippingThreshold` — вітрина його не дублює, щоб кампанію можна
 * було запустити без релізу сайту. Серверні сторінки беруть його через
 * `getFreeShippingThreshold()`, клієнтські компоненти — пропсом.
 *
 * `null` — поріг не задано: безкоштовну доставку ніде не обіцяємо, ні в кошику,
 * ні в оферті. Межа включна, як і `qualifiesForFreeShipping` у самій CRM:
 * рівно поріг уже дає безкоштовну доставку. Рахується сума товарів.
 */
export function qualifiesForFreeShipping(total: number, threshold: number | null): boolean {
  return threshold !== null && total >= threshold;
}

/** Скільки бракує до безкоштовної доставки; 0 — поріг уже досягнуто. */
export function amountToFreeShipping(total: number, threshold: number): number {
  return Math.max(0, threshold - total);
}

/** «5 000 ₴». Поріг у CRM завжди у валюті workspace, а вітрина продає лише в гривнях. */
export function formatThreshold(threshold: number): string {
  return formatPrice(threshold, "UAH");
}
