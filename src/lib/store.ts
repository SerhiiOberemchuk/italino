export const STORE = {
  name: "Italino",
  legalName: "ФОП Оберемчук Сергій Олександрович",
  taxId: "3121116950",
  edrRecord: "2011600000000066020",
  edrDate: "03.07.2026",
  address:
    "Україна, 35610, Рівненська область, Дубенський район, село Сатиїв, вул. Миру, будинок 2",
  phone: "+380 97 044 72 29",
  phoneHref: "tel:+380970447229",
  email: "serhiioberemchuk@gmail.com",
  paymentProvider: "Hutko",
} as const;

export const HUTKO_PAYMENT_KEY = "hutko";

export function publicSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  try {
    return new URL(configured || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export function storefrontUrl(path = "/") {
  const base = publicSiteUrl();
  if (base.protocol !== "https:") return null;
  return new URL(path, base).toString();
}
