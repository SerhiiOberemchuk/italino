/**
 * Тижневий розклад поставок Італія → Україна. Єдине джерело правди для
 * банерів, зворотного відліку та текстів про терміни. Див. docs/DELIVERY.md.
 *
 * Значення — припущення до підтвердження власником (docs/PROJECT.md).
 */
export const SHIPPING_SCHEDULE = {
  timeZone: "Europe/Kyiv",
  /** Дедлайн прийому замовлень у поточну поставку: п'ятниця 18:00 (0 = неділя). Припущення. */
  cutoff: { weekday: 5, hour: 18, minute: 0 },
  /** День відправки зі складу в Мілані: неділя (підтверджено власником). */
  dispatchWeekday: 0,
  /** Днів від відправки до отримання. */
  transitDays: { min: 5, max: 9 },
} as const;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type WallClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
};

function wallClock(date: Date, timeZone: string): WallClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    weekday: "short",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour: Number(read("hour")),
    minute: Number(read("minute")),
    second: Number(read("second")),
    weekday: WEEKDAYS.indexOf(read("weekday")),
  };
}

/** Зсув часового поясу (мс) у момент `date`. */
function zoneOffsetMs(date: Date, timeZone: string): number {
  const wc = wallClock(date, timeZone);
  const asUtc = Date.UTC(wc.year, wc.month - 1, wc.day, wc.hour, wc.minute, wc.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Момент часу для «настінного» часу в заданому поясі (день може виходити за межі місяця). */
function zonedInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const offset = zoneOffsetMs(new Date(guess), timeZone);
  return new Date(guess - offset);
}

/** Найближчий дедлайн прийому замовлень після `now`. */
export function nextCutoff(now: Date = new Date()): Date {
  const { timeZone, cutoff } = SHIPPING_SCHEDULE;
  const wc = wallClock(now, timeZone);
  const daysAhead = (cutoff.weekday - wc.weekday + 7) % 7;
  const candidate = zonedInstant(
    wc.year,
    wc.month,
    wc.day + daysAhead,
    cutoff.hour,
    cutoff.minute,
    timeZone,
  );
  if (candidate.getTime() > now.getTime()) return candidate;
  return zonedInstant(
    wc.year,
    wc.month,
    wc.day + daysAhead + 7,
    cutoff.hour,
    cutoff.minute,
    timeZone,
  );
}

/** День відправки, у який потрапляє замовлення, оформлене до `cutoff`. */
export function dispatchAfter(cutoff: Date): Date {
  const { timeZone, dispatchWeekday } = SHIPPING_SCHEDULE;
  const wc = wallClock(cutoff, timeZone);
  const daysAhead = (dispatchWeekday - wc.weekday + 7) % 7;
  return zonedInstant(wc.year, wc.month, wc.day + daysAhead, 12, 0, timeZone);
}

/** Найближча відправка з Італії для замовлення, оформленого зараз. */
export function nextDispatch(now: Date = new Date()): Date {
  return dispatchAfter(nextCutoff(now));
}

/** Орієнтовне вікно отримання для заданої відправки. */
export function estimatedArrival(dispatch: Date): { from: Date; to: Date } {
  const day = 24 * 60 * 60 * 1000;
  return {
    from: new Date(dispatch.getTime() + SHIPPING_SCHEDULE.transitDays.min * day),
    to: new Date(dispatch.getTime() + SHIPPING_SCHEDULE.transitDays.max * day),
  };
}

/** «неділя, 20 вересня» */
export function formatDispatchDate(date: Date): string {
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: SHIPPING_SCHEDULE.timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export type Countdown = { days: number; hours: number; minutes: number; seconds: number };

export function splitCountdown(ms: number): Countdown {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  };
}
