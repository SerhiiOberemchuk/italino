import { getOrCreatePaymentLink } from "@/lib/crm/orders";
import { CrmError } from "@/lib/crm/client";
import { allowRequest, clientKey } from "@/lib/rate-limit";

export async function POST(request: Request, { params }: RouteContext<"/api/orders/[orderId]/payment-link">) {
  if (!allowRequest(`payment-link:${clientKey(request)}`, 20)) {
    return Response.json({ error: "Забагато спроб. Спробуйте за хвилину." }, { status: 429 });
  }
  try {
    const link = await getOrCreatePaymentLink((await params).orderId);
    return Response.json({ checkoutUrl: link.checkoutUrl, expiresAt: link.expiresAt });
  } catch (error) {
    const status = error instanceof CrmError ? error.status : 502;
    if (status === 404) return Response.json({ error: "Замовлення не знайдено." }, { status: 404 });
    if (status === 400) return Response.json({ error: "Оплата для цього замовлення недоступна." }, { status: 400 });
    return Response.json({ error: "Не вдалося підготувати платіжне посилання." }, { status: 502 });
  }
}
