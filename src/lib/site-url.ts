import "server-only";

/**
 * Базова адреса вітрини — тільки для серверного коду.
 *
 * `SITE_URL` читається на рантаймі й має пріоритет. `NEXT_PUBLIC_SITE_URL`
 * лишається запасним варіантом, але Next вшиває його значення у збірку:
 * задати його лише в оточенні продакшену недостатньо, потрібна пересборка.
 * Саме ця непомітна різниця тихо ламала повернення покупця після оплати.
 */
export function publicSiteUrl(): URL {
  const configured = process.env.SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  try {
    return new URL(configured || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

let warnedAboutSiteUrl = false;

/**
 * Абсолютна https-адреса вітрини — або null, якщо її неможливо побудувати.
 *
 * CRM приймає `returnUrl` лише по https (http відхиляється як `Invalid URL`).
 * Коли його не передати, CRM підставляє власну типову сторінку
 * `${CRM}/payment/complete`, і покупець після оплати повертається не в магазин.
 * Мовчки це ковтати не можна: хибна адреса на проді ламає повернення кожному
 * покупцеві, а в коді має вигляд нормальної роботи.
 */
export function storefrontUrl(path = "/"): string | null {
  const base = publicSiteUrl();
  if (base.protocol !== "https:") {
    if (!warnedAboutSiteUrl) {
      warnedAboutSiteUrl = true;
      console.warn(
        `[Italino] Адреса вітрини ${base.origin} — не https. CRM відхилить такий returnUrl, `
        + "тож після оплати покупець потрапить на типову сторінку CRM замість /order/[orderId]. "
        + "Задайте SITE_URL=https://…",
      );
    }
    return null;
  }
  return new URL(path, base).toString();
}
