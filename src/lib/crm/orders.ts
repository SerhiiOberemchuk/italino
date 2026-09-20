import "server-only";

import { crmGet, crmPost, CrmError } from "./client";
import { HUTKO_PAYMENT_KEY, storefrontUrl } from "@/lib/store";
import type { CrmOrderStatus } from "./types";

const STORE_ORDER_ID = /^italino-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CrmPayment = {
  status?: unknown;
  paidAt?: unknown;
};

type CrmOrderDetail = {
  data: {
    externalId: string;
    status: CrmOrderStatus;
    totalAmount: string;
    currency: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type StoreOrderStatus = {
  orderId: string;
  orderStatus: CrmOrderStatus;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  totalAmount: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
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
    orderStatus: detail.status,
    paymentStatus: paymentStatus(payments),
    totalAmount: detail.totalAmount,
    currency: detail.currency,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
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
    provider: HUTKO_PAYMENT_KEY,
    ttl: "24h",
    ...(returnUrl ? { returnUrl } : {}),
  })).data;
}
