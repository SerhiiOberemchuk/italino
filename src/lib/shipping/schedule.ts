/**
 * Тижневий розклад поставок Італія → Україна. Єдине джерело правди для
 * банерів, зворотного відліку, правових сторінок і примітки до замовлення в CRM.
 * Див. docs/DELIVERY.md.
 *
 * Тексти про графік на сайті не пишуться руками — вони беруться з SCHEDULE_COPY
 * нижче. Колись дедлайн змінили лише у футері, і сайт кілька днів показував два
 * різні графіки одночасно; зміна тут оновлює всі місця разом.
 *
 * Підтверджено власником 2026-09-21: замовлення до середи 16:00 їдуть поставкою
 * цього ж тижня; відправка з Мілана щонеділі; у клієнтів — у середу–четвер.
 */
export const SHIPPING_SCHEDULE = {
  timeZone: "Europe/Kyiv",
  /** Дедлайн прийому замовлень у поточну поставку: середа 16:00 (0 = неділя). */
  cutoff: { weekday: 3, hour: 16, minute: 0 },
  /** День відправки зі складу в Мілані: неділя. */
  dispatchWeekday: 0,
  /** Днів від відправки до передачі в Нову Пошту в Україні: дорога, митниця, ТТН. */
  borderDays: 2,
  /** Днів доставки Новою Поштою до відділення чи поштомату. */
  lastMileDays: { min: 1, max: 2 },
} as const;

/** Днів від відправки до отримання — сума обох етапів. */
export const TRANSIT_DAYS = {
  min: SHIPPING_SCHEDULE.borderDays + SHIPPING_SCHEDULE.lastMileDays.min,
  max: SHIPPING_SCHEDULE.borderDays + SHIPPING_SCHEDULE.lastMileDays.max,
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
    from: new Date(dispatch.getTime() + TRANSIT_DAYS.min * day),
    to: new Date(dispatch.getTime() + TRANSIT_DAYS.max * day),
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

/* ------------------------------------------------------------------------ */
/* Тексти про графік — похідні від SHIPPING_SCHEDULE.                        */
/* ------------------------------------------------------------------------ */

const WEEKDAY = {
  nominative: ["неділя", "понеділок", "вівторок", "середа", "четвер", "п’ятниця", "субота"],
  genitive: ["неділі", "понеділка", "вівторка", "середи", "четверга", "п’ятниці", "суботи"],
  accusative: ["неділю", "понеділок", "вівторок", "середу", "четвер", "п’ятницю", "суботу"],
  short: ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
} as const;

/** 1 день · 2–4 дні · 5–20 днів · 21 день… */
function daysWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дні";
  return "днів";
}

/** «2 дні», «3–4 дні», «5–9 днів» — іменник узгоджується з останнім числом. */
export function formatDays(min: number, max: number = min): string {
  return `${min === max ? min : `${min}–${max}`} ${daysWord(max)}`;
}

function range(from: string, to: string): string {
  return from === to ? from : `${from}–${to}`;
}

const { cutoff, dispatchWeekday, borderDays, lastMileDays } = SHIPPING_SCHEDULE;
const cutoffTime = `${cutoff.hour}:${String(cutoff.minute).padStart(2, "0")}`;
const arrivalFrom = (dispatchWeekday + TRANSIT_DAYS.min) % 7;
const arrivalTo = (dispatchWeekday + TRANSIT_DAYS.max) % 7;

export const SCHEDULE_COPY = {
  /** «до середи 16:00» */
  cutoffUntil: `до ${WEEKDAY.genitive[cutoff.weekday]} ${cutoffTime}`,
  /** «в середу о 16:00» */
  cutoffOn: `в ${WEEKDAY.accusative[cutoff.weekday]} о ${cutoffTime}`,
  /** «Ср, 16:00» */
  cutoffShort: `${WEEKDAY.short[cutoff.weekday]}, ${cutoffTime}`,
  /** «неділя» — запасний текст, поки дата рахується в браузері */
  dispatchName: WEEKDAY.nominative[dispatchWeekday],
  /** «у неділю» */
  dispatchOn: `у ${WEEKDAY.accusative[dispatchWeekday]}`,
  /** «щонеділі» */
  dispatchEvery: `що${WEEKDAY.genitive[dispatchWeekday]}`,
  /** «наступної неділі» */
  dispatchNext: `наступної ${WEEKDAY.genitive[dispatchWeekday]}`,
  /** «Нд» */
  dispatchShort: WEEKDAY.short[dispatchWeekday],
  /** «3–4 дні» — від відправки до отримання */
  transit: formatDays(TRANSIT_DAYS.min, TRANSIT_DAYS.max),
  /** «+2 дні» — до передачі в Нову Пошту */
  borderLeg: `+${formatDays(borderDays)}`,
  /** «+1–2 дні» — доставка Новою Поштою */
  lastMileLeg: `+${formatDays(lastMileDays.min, lastMileDays.max)}`,
  /** «середа–четвер» */
  arrivalDays: range(WEEKDAY.nominative[arrivalFrom], WEEKDAY.nominative[arrivalTo]),
  /** «у середу–четвер» */
  arrivalOn: `у ${range(WEEKDAY.accusative[arrivalFrom], WEEKDAY.accusative[arrivalTo])}`,
} as const;
