/*
 * Рекламна атрибуція: що сайт запам'ятовує з адреси першого заходу й що віддає
 * CRM разом із замовленням. Контракт блоку `attribution` на POST /api/v1/orders
 * (orderAttributionSchema у CRM) і список параметрів узято з CRM
 * (`ATTRIBUTION_QUERY_PARAMS`), щоб сайт і CRM не розходилися. Понад цей список
 * сайт читає лише `gbraid` і `wbraid` (див. CLICK_ID_PARAMS).
 *
 * Список параметрів фіксований свідомо: адреса може нести токен чи e-mail, і
 * зберігати її цілком не можна.
 */

/** Те саме, що в CRM: ключ і строк, щоб віджет і форма читали один візит. */
export const ATTRIBUTION_STORAGE_KEY = "obriym_attr";
export const ATTRIBUTION_LAST_STORAGE_KEY = "obriym_attr_last";
export const ATTRIBUTION_TTL_MS = 30 * 86_400_000;

const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
/*
 * На частині кліків з iOS Google ставить `gbraid` або `wbraid` замість `gclid`.
 * У замовленні одне поле для мітки кліку, тож порядок тут — це пріоритет.
 */
const CLICK_ID_PARAMS = ["gclid", "gbraid", "wbraid", "fbclid", "oppref"] as const;
export const ATTRIBUTION_QUERY_PARAMS: readonly string[] = [...UTM_PARAMS, ...CLICK_ID_PARAMS];

const UTM_VALUE_MAX = 255;
const CLICK_ID_MAX = 512;
const CLICK_ID_PARAM_MAX = 40;

/** Візит у тому вигляді, як він лежить у сховищі: імена параметрів адреси. */
export type StoredTouch = { t: number; v: Record<string, string> };

/** Дотик у формі CRM; порожніх полів немає взагалі (null CRM колись відхилила). */
export type CrmTouch = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  clickId?: string;
  clickIdParam?: string;
};

export type CrmAttribution = CrmTouch & { lastTouch?: CrmTouch & { at?: string } };

const UTM_FIELDS: Record<(typeof UTM_PARAMS)[number], keyof CrmTouch> = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_content: "utmContent",
  utm_term: "utmTerm",
};

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed ? trimmed : null;
}

/** Читає лише дозволені параметри з `location.search`; `null`, якщо адреса не позначена. */
export function readTaggedParams(search: string): Record<string, string> | null {
  let found: Record<string, string> | null = null;
  try {
    const query = new URLSearchParams(search);
    for (const name of ATTRIBUTION_QUERY_PARAMS) {
      const value = clean(query.get(name), CLICK_ID_MAX);
      if (value) (found ??= {})[name] = value;
    }
  } catch {
    // Некоректний рядок запиту не повинен ламати сторінку.
  }
  return found;
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function recall(storage: StorageLike, key: string, now: number): StoredTouch | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredTouch> | null;
    if (!parsed || typeof parsed.t !== "number" || !parsed.v || typeof parsed.v !== "object") return null;
    if (now - parsed.t > ATTRIBUTION_TTL_MS) return null;
    return { t: parsed.t, v: parsed.v as Record<string, string> };
  } catch {
    return null;
  }
}

/**
 * Перший позначений візит живе 30 днів і не перезаписується; кожен наступний
 * позначений візит стає «останнім дотиком». Сховище може кидати (приватний
 * режим), тоді атрибуція просто не запам'ятовується.
 */
export function captureAttribution(search: string, storage: StorageLike, now = Date.now()): void {
  const tagged = readTaggedParams(search);
  if (!tagged) return;
  try {
    if (!recall(storage, ATTRIBUTION_STORAGE_KEY, now)) {
      storage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify({ t: now, v: tagged }));
    }
    storage.setItem(ATTRIBUTION_LAST_STORAGE_KEY, JSON.stringify({ t: now, v: tagged }));
  } catch {
    // Атрибуція — другорядна; недоступне сховище не повинно нікому заважати.
  }
}

/** Значення для прихованого поля форми: JSON або порожній рядок. */
export function serializeStoredAttribution(storage: StorageLike, now = Date.now()): string {
  const first = recall(storage, ATTRIBUTION_STORAGE_KEY, now);
  if (!first) return "";
  const last = recall(storage, ATTRIBUTION_LAST_STORAGE_KEY, now);
  return JSON.stringify({ first, ...(last ? { last } : {}) });
}

function toCrmTouch(values: unknown): CrmTouch | null {
  if (!values || typeof values !== "object") return null;
  const source = values as Record<string, unknown>;
  const touch: CrmTouch = {};
  for (const param of UTM_PARAMS) {
    const value = clean(source[param], UTM_VALUE_MAX);
    if (value) touch[UTM_FIELDS[param]] = value;
  }
  const clickParam = CLICK_ID_PARAMS.find((param) => clean(source[param], CLICK_ID_MAX));
  if (clickParam) {
    touch.clickId = clean(source[clickParam], CLICK_ID_MAX) ?? undefined;
    touch.clickIdParam = clickParam.slice(0, CLICK_ID_PARAM_MAX);
  }
  return Object.keys(touch).length ? touch : null;
}

function sameTouch(a: CrmTouch, b: CrmTouch): boolean {
  return JSON.stringify(a, Object.keys(a).sort()) === JSON.stringify(b, Object.keys(b).sort());
}

/**
 * Перевіряє те, що прийшло з браузера, і будує блок для CRM. Повертає `null`,
 * якщо нічого придатного немає, — тоді блок не надсилається зовсім. Ніколи не
 * кидає: зіпсований рядок означає «без атрибуції», а не втрачене замовлення.
 */
export function parseAttributionInput(raw: string): CrmAttribution | null {
  try {
    if (!raw || raw.length > 8_000) return null;
    const parsed = JSON.parse(raw) as { first?: { v?: unknown }; last?: { t?: unknown; v?: unknown } } | null;
    if (!parsed || typeof parsed !== "object") return null;
    const first = toCrmTouch(parsed.first?.v);
    if (!first) return null;
    const last = toCrmTouch(parsed.last?.v);
    const lastAt = typeof parsed.last?.t === "number" && Number.isFinite(parsed.last.t)
      ? new Date(parsed.last.t).toISOString()
      : undefined;
    // CRM просить не надсилати останній дотик, якщо він збігається з першим.
    const lastTouch = last && !sameTouch(first, last) ? { ...last, ...(lastAt ? { at: lastAt } : {}) } : undefined;
    return { ...first, ...(lastTouch ? { lastTouch } : {}) };
  } catch {
    return null;
  }
}
