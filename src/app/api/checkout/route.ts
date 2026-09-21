import { randomUUID } from "node:crypto";
import { getCapabilities, getLiveProducts } from "@/lib/crm/catalog";
import { crmPost, CrmError } from "@/lib/crm/client";
import type { CrmOrderIntakeResponse } from "@/lib/crm/types";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { shippingMethod } from "@/lib/shipping/methods";
import { formatDispatchDate, nextDispatch } from "@/lib/shipping/schedule";
import { storefrontUrl } from "@/lib/site-url";
import { HUTKO_PAYMENT_KEY } from "@/lib/store";

type Input = {
  customer?: Record<string, unknown>;
  delivery?: Record<string, unknown>;
  payment?: unknown;
  items?: { sku?: unknown; quantity?: unknown }[];
};

const UNAVAILABLE = ["out_of_stock", "discontinued"];
/** Ідентифікатори Нової Пошти — UUID (`CityRef`, `WarehouseRef`). */
const NP_REF = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  if (!allowRequest(`checkout:${clientKey(request)}`, 10)) {
    return Response.json({ error: "Забагато спроб. Спробуйте за хвилину." }, { status: 429 });
  }
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 20_000) return Response.json({ error: "Запит завеликий." }, { status: 413 });

    const input = await request.json() as Input;
    if (!Array.isArray(input.items) || !input.items.length || input.items.length > 100) {
      return Response.json({ error: "Кошик порожній." }, { status: 400 });
    }

    const customer = input.customer ?? {};
    const firstName = text(customer.firstName, 120);
    const lastName = text(customer.lastName, 120);
    const phone = text(customer.phone, 50);
    const email = text(customer.email, 255);
    const city = text(customer.city, 120);
    if (!firstName || !lastName || !phone || !email || !city || !/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json({ error: "Перевірте контактні дані." }, { status: 400 });
    }

    // Ціни й залишки беремо без кешу: це остання перевірка перед списанням грошей.
    const products = await getLiveProducts();
    const quantities = new Map<string, number>();
    for (const line of input.items) {
      const sku = text(line.sku, 120);
      const quantity = Number(line.quantity);
      if (!sku || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new CrmError("INVALID_CART");
      quantities.set(sku, (quantities.get(sku) ?? 0) + quantity);
    }

    const lines = [...quantities].map(([sku, quantity]) => {
      const product = products.find((item) => item.sku === sku);
      if (
        !product
        || product.status !== "active"
        || product.price === null
        || product.currency !== "UAH"
        || quantity > 99
        || UNAVAILABLE.includes(product.availability)
        || (product.stock !== null && quantity > product.stock)
      ) throw new CrmError("INVALID_CART");
      return { productName: product.name, sku, quantity, unitPrice: product.price, discount: 0 };
    });

    const capabilities = await getCapabilities();
    const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    if (
      capabilities.cart.currency !== "UAH"
      || (capabilities.cart.minOrderAmount !== null && total < capabilities.cart.minOrderAmount)
    ) {
      return Response.json({ error: "Сума замовлення не відповідає умовам магазину." }, { status: 400 });
    }

    // Перевізника звіряємо з переліком вітрини, а не з capabilities: CRM віддає
    // серед вбудованих методів самовивіз, якого Italino не пропонує.
    const delivery = shippingMethod(text(input.delivery?.carrier, 120));
    const branch = text(input.delivery?.branch, 200);
    // Ідентифікатори йдуть лише парою: без cityRef накладну за branchRef не
    // створити. Кривий або відсутній ref замовлення не блокує — CRM тоді
    // зіставить підписи як текст, як і було до появи цих полів.
    const cityRef = text(input.delivery?.cityRef, 64);
    const branchRef = text(input.delivery?.branchRef, 64);
    const refs = NP_REF.test(cityRef) && NP_REF.test(branchRef) ? { cityRef, branchRef } : {};
    const payment = text(input.payment, 50);
    const hutko = capabilities.payments.find((method) => method.key === HUTKO_PAYMENT_KEY && method.paymentLink);
    if (!delivery) {
      return Response.json({ error: "Обраний спосіб доставки недоступний." }, { status: 400 });
    }
    if (!branch) {
      return Response.json({ error: "Вкажіть відділення або поштомат Нової Пошти." }, { status: 400 });
    }
    if (payment !== HUTKO_PAYMENT_KEY || !hutko) {
      return Response.json({ error: "Онлайн-оплата тимчасово недоступна. Спробуйте пізніше." }, { status: 503 });
    }

    const externalId = `italino-${randomUUID()}`;
    const order = await crmPost<CrmOrderIntakeResponse>("orders", {
      externalId,
      currency: "UAH",
      items: lines,
      customer: {
        firstName,
        lastName,
        phone,
        email,
        shippingAddress: { country: "UA", city, line1: branch },
      },
      delivery: {
        carrier: delivery.key,
        method: delivery.method,
        branch,
        ...refs,
        cod: false,
        comment: text(input.delivery?.comment, 1000) || undefined,
      },
      notes: `Замовлення сайту Italino. Найближча відправка: ${formatDispatchDate(nextDispatch())}. Онлайн-оплата.`,
    });

    let paymentUrl: string | undefined;
    let paymentPending = false;
    try {
      const returnUrl = storefrontUrl(`/order/${encodeURIComponent(externalId)}`);
      const link = await crmPost<{ data: { checkoutUrl: string } }>(
        `orders/${encodeURIComponent(externalId)}/payment-link`,
        { provider: HUTKO_PAYMENT_KEY, ttl: "24h", ...(returnUrl ? { returnUrl } : {}) },
      );
      paymentUrl = link.data.checkoutUrl;
    } catch (error) {
      paymentPending = true;
      console.error("[CRM Hutko payment link]", error instanceof CrmError ? { code: error.code, requestId: error.requestId } : { code: "UNKNOWN" });
    }

    return Response.json({ orderId: order.data.externalId, paymentUrl, paymentPending }, { status: 201 });
  } catch (error) {
    console.error("[Checkout]", error instanceof CrmError ? { code: error.code, status: error.status, requestId: error.requestId } : { code: "UNKNOWN" });
    return Response.json({
      error: error instanceof CrmError && error.code === "INVALID_CART"
        ? "Один із товарів уже недоступний або змінив залишок. Оновіть кошик."
        : "Не вдалося створити замовлення. Спробуйте ще раз.",
    }, { status: error instanceof SyntaxError ? 400 : 502 });
  }
}
