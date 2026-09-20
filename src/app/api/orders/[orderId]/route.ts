import { getStoreOrderStatus } from "@/lib/crm/orders";
import { CrmError } from "@/lib/crm/client";

type Context = { params: Promise<{ orderId: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    return Response.json(await getStoreOrderStatus((await params).orderId));
  } catch (error) {
    const status = error instanceof CrmError && error.status === 404 ? 404 : 502;
    return Response.json({ error: status === 404 ? "Замовлення не знайдено." : "Не вдалося оновити стан замовлення." }, { status });
  }
}
