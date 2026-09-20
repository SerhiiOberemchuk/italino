import { randomUUID } from "node:crypto";
import { getCapabilities, getStoreProducts } from "@/lib/crm/catalog";
import { crmPost, CrmError } from "@/lib/crm/client";
import type { CrmOrderIntakeResponse } from "@/lib/crm/types";
import { formatDispatchDate, nextDispatch } from "@/lib/shipping/schedule";
import { HUTKO_PAYMENT_KEY, storefrontUrl } from "@/lib/store";

type Input = { customer?: Record<string, unknown>; delivery?: Record<string, unknown>; payment?: unknown; items?: { sku?: unknown; quantity?: unknown }[] };
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 20_000) return Response.json({ error: "Запит завеликий." }, { status: 413 });
    const input = await request.json() as Input;
    if (!Array.isArray(input.items) || !input.items.length || input.items.length > 100) return Response.json({ error: "Кошик порожній." }, { status: 400 });
    const customer = input.customer ?? {};
    const firstName = text(customer.firstName, 120), lastName = text(customer.lastName, 120), phone = text(customer.phone, 50), email = text(customer.email, 255), city = text(customer.city, 120);
    if (!firstName || !lastName || !phone || !email || !city || !/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Перевірте контактні дані." }, { status: 400 });
    const products = await getStoreProducts();
    const quantities = new Map<string, number>();
    for (const line of input.items) {
      const sku = text(line.sku, 120); const quantity = Number(line.quantity);
      if (!sku || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new CrmError("INVALID_CART");
      quantities.set(sku, (quantities.get(sku) ?? 0) + quantity);
    }
    const lines = [...quantities].map(([sku, quantity]) => {
      const product = products.find((item) => item.sku === sku);
      if (!product || product.status !== "active" || product.price === null || product.currency !== "UAH" || quantity > 99 || ["out_of_stock", "discontinued"].includes(product.availability) || (product.stock !== null && quantity > product.stock)) throw new CrmError("INVALID_CART");
      return { productName: product.name, sku, quantity, unitPrice: product.price, discount: 0 };
    });
    const capabilities = await getCapabilities();
    const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    if (capabilities.cart.currency !== "UAH" || (capabilities.cart.minOrderAmount !== null && total < capabilities.cart.minOrderAmount)) return Response.json({ error: "Сума замовлення не відповідає умовам магазину." }, { status: 400 });
    const carrier = text(input.delivery?.carrier, 120); const payment = text(input.payment, 50);
    const hutko = capabilities.payments.find((method) => method.key === HUTKO_PAYMENT_KEY && method.paymentLink);
    if (!capabilities.shipping.some((method) => method.key === carrier)) return Response.json({ error: "Обраний спосіб доставки недоступний." }, { status: 400 });
    if (payment !== HUTKO_PAYMENT_KEY || !hutko) return Response.json({ error: "Онлайн-оплата тимчасово недоступна. Спробуйте пізніше." }, { status: 503 });
    const externalId = `italino-${randomUUID()}`;
    const order = await crmPost<CrmOrderIntakeResponse>("orders", { externalId, currency: "UAH", items: lines, customer: { firstName, lastName, phone, email, shippingAddress: { country: "UA", city, line1: text(input.delivery?.branch, 255) || (carrier === "pickup" ? "Самовивіз" : "Уточнити з покупцем") } }, delivery: { carrier, method: carrier === "pickup" ? "pickup" : "branch", branch: text(input.delivery?.branch, 200) || undefined, cod: false, comment: text(input.delivery?.comment, 1000) || undefined }, notes: `Замовлення сайту Italino. Найближча відправка: ${formatDispatchDate(nextDispatch())}. Онлайн-оплата.` });
    let paymentUrl: string | undefined;
    let paymentPending = false;
    try {
      const returnUrl = storefrontUrl(`/order/${encodeURIComponent(externalId)}`);
      const link = await crmPost<{ data: { checkoutUrl: string } }>(`orders/${encodeURIComponent(externalId)}/payment-link`, { provider: HUTKO_PAYMENT_KEY, ttl: "24h", ...(returnUrl ? { returnUrl } : {}) });
      paymentUrl = link.data.checkoutUrl;
    } catch (error) {
      paymentPending = true;
      console.error("[CRM Hutko payment link]", error instanceof CrmError ? { code: error.code, requestId: error.requestId } : { code: "UNKNOWN" });
    }
    return Response.json({ orderId: order.data.externalId, paymentUrl, paymentPending }, { status: 201 });
  } catch (error) {
    console.error("[Checkout]", error instanceof CrmError ? { code: error.code, status: error.status, requestId: error.requestId } : { code: "UNKNOWN" });
    return Response.json({ error: error instanceof CrmError && error.code === "INVALID_CART" ? "Один із товарів уже недоступний або змінив залишок. Оновіть кошик." : "Не вдалося створити замовлення. Спробуйте ще раз." }, { status: error instanceof SyntaxError ? 400 : 502 });
  }
}
