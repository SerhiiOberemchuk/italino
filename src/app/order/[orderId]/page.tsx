import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrderStatus } from "@/components/checkout/order-status";
import { OrderStatusSkeleton } from "@/components/checkout/order-status-skeleton";
import { getFreeShippingThreshold } from "@/lib/crm/catalog";
import { CrmError } from "@/lib/crm/client";
import { getStoreOrderStatus } from "@/lib/crm/orders";
import { qualifiesForFreeShipping } from "@/lib/shipping/free-shipping";
import styles from "../../shop.module.css";

async function Order({ params }: PageProps<"/order/[orderId]">) {
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
  return <OrderStatus initialOrder={order} freeShipping={freeShipping} />;
}

export default function Page(props: PageProps<"/order/[orderId]">) {
  return (
    <main className={`wrap ${styles.page}`}>
      <Suspense fallback={<OrderStatusSkeleton />}>
        <Order {...props} />
      </Suspense>
    </main>
  );
}
