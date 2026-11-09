import Clarity from "@microsoft/clarity";
import { sendGAEvent } from "@next/third-parties/google";

/** Проєкт Microsoft Clarity. Не секрет: ID однаково видно в коді сторінки. */
export const CLARITY_PROJECT_ID = "ylx61ogtjw";

/** Потік Google Analytics 4. Теж публічний. */
export const GA_MEASUREMENT_ID = "G-5PRGP4ZY51";

/*
 * Тег Google Ads і мітка конверсії «Покупка». Next вшиває `NEXT_PUBLIC_*` під
 * час `next build`: без цих змінних у середовищі збірки реклама мовчки вимкнена.
 */
const GOOGLE_ADS_ID = "AW-18527541640";
const GOOGLE_ADS_PURCHASE_LABEL = "x7c9CL_om7UdEIizz4JF";

/*
 * Поза продакшн-доменом (localhost, preview) аналітики свідомо немає, а пакетні
 * функції на це не розраховують: `Clarity.event()` падає без `window.clarity`,
 * `sendGAEvent()` пише попередження в консоль. Тому події йдуть лише через
 * `trackEvent()`, яка спершу перевіряє, чи інструмент справді підключено.
 *
 * `window.gtag` з'являється тільки зі скриптом GA: згода за замовчуванням
 * (consent-defaults.ts) навмисно не робить `gtag` глобальним.
 */
function clarityReady(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as { clarity?: unknown }).clarity === "function"
  );
}

function gaReady(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as { gtag?: unknown }).gtag === "function"
  );
}

type EventParams = Record<
  string,
  string | number | Record<string, string | number>[]
>;

/**
 * Подія в обидва інструменти. Clarity бере лише назву; GA — ще й параметри
 * (`value`, `currency`, `items`) для звітів електронної комерції.
 * Повертає `true`, якщо подію прийняв GA: події, які не можна повторити
 * (purchase), позначають надісланими лише після цього.
 */
export function trackEvent(name: string, params: EventParams = {}): boolean {
  if (clarityReady()) Clarity.event(name);
  if (!gaReady()) return false;
  sendGAEvent("event", name, params);
  return true;
}

/** Додає Google Ads до наявного gtag.js. Викликати після `<GoogleAnalytics>`. */
export function configureGoogleAds(): void {
  if (GOOGLE_ADS_ID) sendGAEvent("config", GOOGLE_ADS_ID);
}

/** Конверсія «Покупка»: `send_to` веде її лише в Google Ads, повз звіти GA4. */
export function trackAdsConversion(params: {
  transaction_id: string;
  value: number;
  currency: string;
}): void {
  if (!GOOGLE_ADS_ID || !GOOGLE_ADS_PURCHASE_LABEL || !gaReady()) return;
  sendGAEvent("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
    ...params,
  });
}
