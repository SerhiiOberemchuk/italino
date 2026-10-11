import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

/**
 * Вебхук CRM: скидає кеш каталогу, коли змінилися товари або умови магазину.
 * Без нього теги `catalog`/`products`/`categories`/`capabilities` оновлювалися б лише через
 * закінчення `cacheLife("minutes")`.
 *
 * Два способи виклику POST /api/revalidate:
 * - вебхук Obriym CRM: `x-obriym-signature: sha256=<HMAC-SHA256(секрет, сире тіло)>`,
 *   де секрет — той, що вписано у вебхук у CRM; тіло `{ event, timestamp, data }`
 *   скидає всі теги каталогу;
 * - вручну: заголовок `x-revalidate-secret` і тіло `{ "tags": ["products"] }`
 *   (без `tags` — усі теги каталогу).
 * Обидва звіряються з одним `REVALIDATE_SECRET`.
 */
const KNOWN_TAGS = ["catalog", "products", "categories", "capabilities"] as const;

function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function crmSignatureMatches(signature: string, body: string, secret: string): boolean {
  if (!signature.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(body, "utf8").digest("hex");
  return secretMatches(signature.slice("sha256=".length), expected);
}

export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_SECRET?.trim();
  if (!expected) return Response.json({ error: "Ревалідацію не налаштовано." }, { status: 503 });

  // Підпис CRM рахується від сирих байтів тіла, тож читаємо його текстом один раз.
  const body = await request.text();
  const signature = request.headers.get("x-obriym-signature")?.trim() ?? "";
  const provided = request.headers.get("x-revalidate-secret")?.trim() ?? "";
  const authorized = signature
    ? crmSignatureMatches(signature, body, expected)
    : secretMatches(provided, expected);
  if (!authorized) {
    return Response.json({ error: "Доступ заборонено." }, { status: 403 });
  }

  let requested: unknown;
  try {
    requested = (JSON.parse(body) as { tags?: unknown })?.tags;
  } catch {
    requested = undefined;
  }

  const tags = Array.isArray(requested)
    ? KNOWN_TAGS.filter((tag) => requested.includes(tag))
    : [...KNOWN_TAGS];
  if (!tags.length) return Response.json({ error: "Невідомий тег." }, { status: 400 });

  // "max" — читачі бачать старі дані, доки поруч підвантажуються свіжі.
  for (const tag of tags) revalidateTag(tag, "max");

  return Response.json({ revalidated: tags });
}
