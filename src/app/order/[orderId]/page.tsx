import { connection } from "next/server";
import { notFound } from "next/navigation";
import { OrderStatus } from "@/components/checkout/order-status";
import { CrmError } from "@/lib/crm/client";
import { getStoreOrderStatus } from "@/lib/crm/orders";
import styles from "../../shop.module.css";

type PageProps = { params: Promise<{ orderId: string }> };

export default async function Page({ params }: PageProps) {
  await connection();
  const { orderId } = await params;
  let order;
  try {
    order = await getStoreOrderStatus(orderId);
  } catch (error) {
    if (error instanceof CrmError && error.status === 404) notFound();
    throw error;
  }
  return <main className={`wrap ${styles.page}`}><OrderStatus initialOrder={order} /></main>;
}
