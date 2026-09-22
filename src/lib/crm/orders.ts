import "server-only";

import { crmGet, crmPost, CrmError } from "./client";
import { storefrontUrl } from "@/lib/site-url";
import { ROZETKAPAY_PAYMENT_KEY } from "@/lib/store";
import type { CrmOrderStatus } from "./types";

const STORE_ORDER_ID = /^italino-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CrmPayment = {
  status?: unknown;
  paidAt?: unknown;
};

type CrmOrderDetail = {
  data: {
    externalId: string;
    /** Людський номер CRM, напр. «20260920-023». Старі замовлення можуть його не мати. */
    number?: string | null;
    status: CrmOrderStatus;
    totalAmount: string;
    currency: string;
    createdAt: string;
    updatedAt: string;
    /** Знімки позицій на момент замовлення; поля — як у рядках `crm_order_items`. */
    items?: unknown;
  };
};

/** Рядок квитанції. `total` уже з урахуванням знижки рядка. */
export type StoreOrderItem = {
  name: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type StoreOrderStatus = {
  orderId: string;
  /** Що показувати покупцеві й диктувати менеджеру; адреса сторінки лишається на orderId. */
  number: string | null;
  orderStatus: CrmOrderStatus;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  totalAmount: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  items: StoreOrderItem[];
  /** Час першої успішної оплати; `null`, доки замовлення не оплачене. */
  paidAt: string | null;
};

type CrmPaymentLink = {
  data: {
    checkoutUrl: string;
    expiresAt: string | null;
  };
};

function validOrderId(orderId: string): boolean {
  return STORE_ORDER_ID.test(orderId);
}

function paymentStatus(payments: CrmPayment[]): StoreOrderStatus["paymentStatus"] {
  const statuses = payments.map((payment) => typeof payment.status === "string" ? payment.status : "");
  if (statuses.includes("paid")) return "paid";
  if (statuses.some((status) => status === "refunded" || status === "partially_refunded")) return "refunded";
  if (statuses.some((status) => status === "failed" || status === "cancelled")) return "failed";
  return "pending";
}

function paidAt(payments: CrmPayment[]): string | null {
  const times = payments
    .filter((payment) => payment.status === "paid" && typeof payment.paidAt === "string")
    .map((payment) => payment.paidAt as string)
    .sort();
  return times[0] ?? null;
}

function orderItems(raw: unknown): StoreOrderItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row: unknown) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    if (typeof item.productName !== "string" || !Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return [];
    const discount = Number(item.discount ?? 0);
    return [{
      name: item.productName,
      sku: typeof item.sku === "string" && item.sku ? item.sku : null,
      quantity,
      unitPrice,
      // Та сама формула, що `calcOrderItemTotal` у CRM: знижка рядка — у відсотках.
      total: unitPrice * quantity * (1 - (Number.isFinite(discount) ? discount : 0) / 100),
    }];
  });
}

async function getPayments(orderId: string): Promise<CrmPayment[]> {
  const response = await crmGet<{ data?: unknown }>(`orders/${encodeURIComponent(orderId)}/payments`);
  return Array.isArray(response.data) ? response.data.filter((payment): payment is CrmPayment => Boolean(payment) && typeof payment === "object") : [];
}

export async function getStoreOrderStatus(orderId: string): Promise<StoreOrderStatus> {
  if (!validOrderId(orderId)) throw new CrmError("ORDER_NOT_FOUND", 404);
  const [order, payments] = await Promise.all([
    crmGet<CrmOrderDetail>(`orders/${encodeURIComponent(orderId)}`),
    getPayments(orderId),
  ]);
  const detail = order.data;
  if (!detail || detail.externalId !== orderId) throw new CrmError("ORDER_NOT_FOUND", 404);
  return {
    orderId,
    number: typeof detail.number === "string" && detail.number.trim() ? detail.number.trim() : null,
    orderStatus: detail.status,
    paymentStatus: paymentStatus(payments),
    totalAmount: detail.totalAmount,
    currency: detail.currency,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    items: orderItems(detail.items),
    paidAt: paidAt(payments),
  };
}

export async function getOrCreatePaymentLink(orderId: string): Promise<CrmPaymentLink["data"]> {
  const order = await getStoreOrderStatus(orderId);
  if (order.paymentStatus === "paid" || order.orderStatus === "cancelled" || order.orderStatus === "refunded") {
    throw new CrmError("PAYMENT_NOT_AVAILABLE", 400);
  }

  try {
    return (await crmGet<CrmPaymentLink>(`orders/${encodeURIComponent(orderId)}/payment-link`)).data;
  } catch (error) {
    if (!(error instanceof CrmError) || error.status !== 404) throw error;
  }

  const returnUrl = storefrontUrl(`/order/${encodeURIComponent(orderId)}`);
  return (await crmPost<CrmPaymentLink>(`orders/${encodeURIComponent(orderId)}/payment-link`, {
    provider: ROZETKAPAY_PAYMENT_KEY,
    ttl: "24h",
    ...(returnUrl ? { returnUrl } : {}),
  })).data;
}
