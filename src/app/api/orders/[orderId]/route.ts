import { getStoreOrderStatus } from "@/lib/crm/orders";
import { CrmError } from "@/lib/crm/client";
import { allowRequest, clientKey } from "@/lib/rate-limit";

export async function GET(request: Request, { params }: RouteContext<"/api/orders/[orderId]">) {
  if (!allowRequest(`order-status:${clientKey(request)}`, 60)) {
    return Response.json({ error: "Забагато запитів. Спробуйте за хвилину." }, { status: 429 });
  }
  try {
    return Response.json(await getStoreOrderStatus((await params).orderId));
  } catch (error) {
    const status = error instanceof CrmError && error.status === 404 ? 404 : 502;
    return Response.json({ error: status === 404 ? "Замовлення не знайдено." : "Не вдалося оновити стан замовлення." }, { status });
  }
}
