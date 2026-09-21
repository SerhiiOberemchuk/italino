import Clarity from "@microsoft/clarity";
import { sendGAEvent } from "@next/third-parties/google";

/** Проєкт Microsoft Clarity. Не секрет: ID однаково видно в коді сторінки. */
export const CLARITY_PROJECT_ID = "ylx61ogtjw";

/** Потік Google Analytics 4. Теж публічний. */
export const GA_MEASUREMENT_ID = "G-5PRGP4ZY51";

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
  return typeof window !== "undefined" && typeof (window as { clarity?: unknown }).clarity === "function";
}

function gaReady(): boolean {
  return typeof window !== "undefined" && typeof (window as { gtag?: unknown }).gtag === "function";
}

type EventParams = Record<string, string | number | Record<string, string | number>[]>;

/**
 * Подія в обидва інструменти. Clarity бере лише назву; GA — ще й параметри
 * (`value`, `currency`, `items`) для звітів електронної комерції.
 */
export function trackEvent(name: string, params: EventParams = {}): void {
  if (clarityReady()) Clarity.event(name);
  if (gaReady()) sendGAEvent("event", name, params);
}
