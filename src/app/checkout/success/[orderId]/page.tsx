import { redirect } from "next/navigation";

/** Запасний зворотний маршрут Hutko: статус замовлення живе на /order/[orderId]. */
export default async function Page({ params }: PageProps<"/checkout/success/[orderId]">) {
  redirect(`/order/${encodeURIComponent((await params).orderId)}`);
}
