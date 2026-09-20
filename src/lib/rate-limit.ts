import "server-only";

/**
 * Лічильник у пам'яті процесу: відсікає очевидний флуд з однієї адреси.
 * У serverless кожен інстанс має власний лічильник, тож це не заміна ліміту
 * на рівні платформи чи CDN — лише дешевий перший бар'єр перед CRM.
 */
const WINDOW_MS = 60_000;
const MAX_BUCKETS = 10_000;

const buckets = new Map<string, { count: number; resetAt: number }>();

/** Ключ клієнта за заголовками проксі; за відсутності — спільний кошик «unknown». */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function allowRequest(key: string, limit: number): boolean {
  const now = Date.now();

  if (buckets.size >= MAX_BUCKETS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
    if (buckets.size >= MAX_BUCKETS) buckets.clear();
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}
