import { connection } from "next/server";
import { notFound } from "next/navigation";
import { OrderStatus } from "@/components/checkout/order-status";
import { getFreeShippingThreshold } from "@/lib/crm/catalog";
import { CrmError } from "@/lib/crm/client";
import { getStoreOrderStatus } from "@/lib/crm/orders";
import { qualifiesForFreeShipping } from "@/lib/shipping/free-shipping";
import styles from "../../shop.module.css";

export default async function Page({ params }: PageProps<"/order/[orderId]">) {
  await connection();
  const { orderId } = await params;
  let order;
  try {
    order = await getStoreOrderStatus(orderId);
  } catch (error) {
    if (error instanceof CrmError && error.status === 404) notFound();
    throw error;
  }
  // Поріг читаємо поточний: він задається в CRM і змінюється рідко.
  const freeFrom = order.currency === "UAH" ? await getFreeShippingThreshold() : null;
  const freeShipping = qualifiesForFreeShipping(Number(order.totalAmount), freeFrom);
  return <main className={`wrap ${styles.page}`}><OrderStatus initialOrder={order} freeShipping={freeShipping} /></main>;
}
