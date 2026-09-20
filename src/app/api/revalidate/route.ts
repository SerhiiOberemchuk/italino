import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

/**
 * Вебхук CRM: скидає кеш каталогу, коли змінилися товари або умови магазину.
 * Без нього теги `catalog`/`products`/`capabilities` оновлювалися б лише через
 * закінчення `cacheLife("minutes")`.
 *
 * Виклик: POST /api/revalidate з заголовком `x-revalidate-secret`
 * і тілом `{ "tags": ["products"] }` (за замовчуванням — усі теги каталогу).
 */
const KNOWN_TAGS = ["catalog", "products", "capabilities"] as const;

function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_SECRET?.trim();
  if (!expected) return Response.json({ error: "Ревалідацію не налаштовано." }, { status: 503 });

  const provided = request.headers.get("x-revalidate-secret")?.trim() ?? "";
  if (!secretMatches(provided, expected)) {
    return Response.json({ error: "Доступ заборонено." }, { status: 403 });
  }

  let requested: unknown;
  try {
    requested = ((await request.json()) as { tags?: unknown })?.tags;
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
