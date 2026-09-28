"use server";

import { headers } from "next/headers";
import type { CartItem } from "@/lib/cart-item";
import { getCapabilities, getLiveProductBySku } from "@/lib/crm/catalog";
import { crmPost, CrmError } from "@/lib/crm/client";
import { getOrCreatePaymentLink, getStoreOrderStatus } from "@/lib/crm/orders";
import type { CrmOrderIntakeResponse, CrmProduct } from "@/lib/crm/types";
import { clientKeyFromHeaders, allowRequest } from "@/lib/rate-limit";
import { qualifiesForFreeShipping, formatThreshold } from "@/lib/shipping/free-shipping";
import { shippingMethod } from "@/lib/shipping/methods";
import { formatDispatchDate, nextDispatch } from "@/lib/shipping/schedule";
import { storefrontUrl } from "@/lib/site-url";
import { ROZETKAPAY_PAYMENT_KEY } from "@/lib/store";

export type CheckoutActionState = {
  status: "idle" | "error" | "cart_changed" | "success";
  message?: string;
  items?: CartItem[];
  orderId?: string;
  paymentUrl?: string;
  paymentPending?: boolean;
  total?: number;
};

type RequestedLine = {
  sku: string;
  quantity: number;
  price: number;
  currency: string;
};

const UNAVAILABLE = ["out_of_stock", "discontinued"];
const ATTEMPT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NP_REF = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^\S+@\S+\.\S+$/;

function text(value: FormDataEntryValue | null, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function requestedLines(value: unknown): RequestedLine[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) return null;

  const lines = new Map<string, RequestedLine>();
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const candidate = item as Record<string, unknown>;
    const sku = typeof candidate.sku === "string" ? candidate.sku.trim().slice(0, 120) : "";
    const quantity = Number(candidate.quantity);
    const price = Number(candidate.price);
    const currency = typeof candidate.currency === "string" ? candidate.currency.trim().slice(0, 8) : "";
    if (
      !sku
      || !Number.isInteger(quantity)
      || quantity < 1
      || quantity > 99
      || !Number.isFinite(price)
      || price < 0
      || !currency
    ) return null;

    const existing = lines.get(sku);
    if (existing) {
      if (existing.price !== price || existing.currency !== currency) return null;
      existing.quantity += quantity;
      if (existing.quantity > 99) return null;
    } else {
      lines.set(sku, { sku, quantity, price, currency });
    }
  }
  return [...lines.values()];
}

function currentCartItem(product: CrmProduct, quantity: number): CartItem {
  const key = product.productGroupId ?? product.id;
  return {
    productId: product.id,
    sku: product.sku ?? "",
    name: product.name,
    image: product.images[0]?.url ?? null,
    price: product.price ?? 0,
    currency: product.currency,
    color: product.color,
    size: product.size,
    quantity,
    href: `/product/${encodeURIComponent(key)}?sku=${encodeURIComponent(product.sku ?? "")}`,
    maxQuantity: product.stock,
  };
}

function validPaymentUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

async function recoverCheckout(orderId: string): Promise<CheckoutActionState | null> {
  try {
    const order = await getStoreOrderStatus(orderId);
    let paymentUrl: string | undefined;
    try {
      const payment = await getOrCreatePaymentLink(orderId);
      if (validPaymentUrl(payment.checkoutUrl)) paymentUrl = payment.checkoutUrl;
    } catch {
      // The order is safe; its status page can retry payment-link creation.
    }
    return {
      status: "success",
      orderId,
      paymentUrl,
      paymentPending: !paymentUrl,
      total: Number(order.totalAmount),
    };
  } catch (error) {
    if (error instanceof CrmError && error.status === 404) return null;
    throw error;
  }
}

function checkoutError(error: unknown): string {
  if (error instanceof CrmError && (error.code === "CONNECTION_FAILED" || error.status >= 500)) {
    return "Сервіс замовлень тимчасово недоступний. Спробуйте ще раз.";
  }
  return "Не вдалося створити замовлення. Спробуйте ще раз.";
}

export async function submitCheckout(
  _previousState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const requestHeaders = await headers();
  if (!allowRequest(`checkout:${clientKeyFromHeaders(requestHeaders)}`, 10)) {
    return { status: "error", message: "Забагато спроб. Спробуйте за хвилину." };
  }

  const attemptId = text(formData.get("attemptId"), 64);
  if (!ATTEMPT_ID.test(attemptId)) {
    return { status: "error", message: "Оновіть сторінку та повторіть оформлення." };
  }
  const orderId = `italino-${attemptId}`;

  let rawLines: unknown;
  try {
    rawLines = JSON.parse(text(formData.get("items"), 50_000));
  } catch {
    return { status: "error", message: "Кошик має некоректний формат." };
  }
  const requested = requestedLines(rawLines);
  if (!requested) {
    return { status: "error", message: "Кошик порожній або містить некоректні дані." };
  }

  const firstName = text(formData.get("firstName"), 120);
  const lastName = text(formData.get("lastName"), 120);
  const phone = text(formData.get("phone"), 50);
  const email = text(formData.get("email"), 255);
  const city = text(formData.get("city"), 120);
  const branch = text(formData.get("branch"), 200);
  const shipping = text(formData.get("shipping"), 120);
  const payment = text(formData.get("payment"), 50);
  const consent = text(formData.get("consent"), 20);
  if (!firstName || !lastName || !phone || !email || !city || !EMAIL.test(email) || consent !== "accepted") {
    return { status: "error", message: "Перевірте контактні дані та підтвердьте згоду." };
  }

  try {
    const liveProducts = new Map(
      (await Promise.all(requested.map(async ({ sku }) => [sku, await getLiveProductBySku(sku)] as const)))
        .filter((entry): entry is readonly [string, CrmProduct] => entry[1] !== null),
    );
    const cartItems: CartItem[] = [];
    let cartChanged = false;

    for (const line of requested) {
      const product = liveProducts.get(line.sku);
      if (
        !product
        || !product.sku
        || product.price === null
        || product.currency !== "UAH"
        || product.status !== "active"
        || UNAVAILABLE.includes(product.availability)
      ) {
        cartChanged = true;
        continue;
      }

      const available = product.stock === null ? 99 : Math.max(0, Math.min(99, Math.floor(product.stock)));
      const quantity = Math.min(line.quantity, available);
      if (quantity < 1) {
        cartChanged = true;
        continue;
      }
      cartItems.push(currentCartItem(product, quantity));
      if (quantity !== line.quantity || product.price !== line.price || product.currency !== line.currency) {
        cartChanged = true;
      }
    }

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (cartChanged || cartItems.length !== requested.length) {
      const existing = await recoverCheckout(orderId);
      if (existing) return existing;
      return {
        status: "cart_changed",
        message: "Ціна або наявність змінилася. Ми оновили кошик — перевірте його перед оплатою.",
        items: cartItems,
        total,
      };
    }

    const capabilities = await getCapabilities();
    if (
      capabilities.cart.currency !== "UAH"
      || (capabilities.cart.minOrderAmount !== null && total < capabilities.cart.minOrderAmount)
    ) {
      return { status: "error", message: "Сума замовлення не відповідає умовам магазину." };
    }

    const delivery = shippingMethod(shipping);
    const rozetkapay = capabilities.payments.find(
      (method) => method.key === ROZETKAPAY_PAYMENT_KEY && method.paymentLink,
    );
    if (!delivery) return { status: "error", message: "Обраний спосіб доставки недоступний." };
    if (!branch) return { status: "error", message: "Вкажіть відділення або поштомат Нової Пошти." };
    if (payment !== ROZETKAPAY_PAYMENT_KEY || !rozetkapay) {
      return { status: "error", message: "Онлайн-оплата тимчасово недоступна. Спробуйте пізніше." };
    }

    const cityRef = text(formData.get("cityRef"), 64);
    const branchRef = text(formData.get("branchRef"), 64);
    const refs = NP_REF.test(cityRef) && NP_REF.test(branchRef) ? { cityRef, branchRef } : {};
    const freeFrom = capabilities.cart.freeShippingThreshold;
    const lines = cartItems.map((item) => ({
      productName: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.price,
      discount: 0,
    }));

    let order: CrmOrderIntakeResponse;
    try {
      order = await crmPost<CrmOrderIntakeResponse>("orders", {
        externalId: orderId,
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
          comment: text(formData.get("comment"), 1000) || undefined,
        },
        notes: [
          "Замовлення сайту Italino.",
          `Найближча відправка: ${formatDispatchDate(nextDispatch())}.`,
          "Онлайн-оплата.",
          ...(freeFrom !== null && qualifiesForFreeShipping(total, freeFrom)
            ? [`БЕЗКОШТОВНА ДОСТАВКА (від ${formatThreshold(freeFrom)}): ТТН оформити за рахунок відправника.`]
            : []),
        ].join(" "),
      });
    } catch (error) {
      if (error instanceof CrmError && error.status === 409) {
        const existing = await recoverCheckout(orderId);
        if (existing) return existing;
      }
      throw error;
    }

    let paymentUrl: string | undefined;
    let paymentPending = false;
    try {
      if (order.data.deduplicated) {
        const link = await getOrCreatePaymentLink(orderId);
        if (validPaymentUrl(link.checkoutUrl)) paymentUrl = link.checkoutUrl;
      } else {
        const returnUrl = storefrontUrl(`/order/${encodeURIComponent(orderId)}`);
        const link = await crmPost<{ data: { checkoutUrl: string } }>(
          `orders/${encodeURIComponent(orderId)}/payment-link`,
          { provider: ROZETKAPAY_PAYMENT_KEY, ttl: "24h", ...(returnUrl ? { returnUrl } : {}) },
        );
        if (validPaymentUrl(link.data.checkoutUrl)) paymentUrl = link.data.checkoutUrl;
      }
      paymentPending = !paymentUrl;
    } catch {
      paymentPending = true;
    }

    return {
      status: "success",
      orderId: order.data.externalId,
      paymentUrl,
      paymentPending,
      total,
    };
  } catch (error) {
    console.error("[Checkout]", error instanceof CrmError
      ? { code: error.code, status: error.status, requestId: error.requestId }
      : { code: "UNKNOWN" });
    return { status: "error", message: checkoutError(error) };
  }
}
