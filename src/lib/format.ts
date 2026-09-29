const CURRENCY_SYMBOLS: Record<string, string> = { UAH: "₴", EUR: "€", USD: "$" };

/**
 * «3 490 ₴» — без копійок. Форматуємо вручну, а не через `Intl.NumberFormat`:
 * ICU у Node і в браузерах дає різні символи й пробіли (Node — «89 ₴», частина
 * браузерів — «89 грн»), а клієнтські компоненти рендеряться і там, і там —
 * різний текст ламає гідратацію (React #418).
 */
export function formatPrice(amount: number, currency = "UAH"): string {
  const rounded = Math.round(Math.abs(amount));
  const digits = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sign = amount < 0 && rounded > 0 ? "-" : "";
  return `${sign}${digits} ${CURRENCY_SYMBOLS[currency] ?? currency}`;
}

const KYIV_DATE_PARTS = new Intl.DateTimeFormat("uk-UA", {
  timeZone: "Europe/Kyiv",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * «29.09.2026, 14:05» за київським часом. Лише числові частини й явний часовий
 * пояс: сервер (UTC) і браузер покупця мають дати однаковий текст.
 */
export function formatDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    KYIV_DATE_PARTS.formatToParts(date).find((item) => item.type === type)?.value ?? "";
  return `${part("day")}.${part("month")}.${part("year")}, ${part("hour")}:${part("minute")}`;
}
