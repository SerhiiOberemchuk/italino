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

    // 409 — у CRM підключено кілька акаунтів RozetkaPay, і вона не вгадує, на який
    // з них слати гроші. Це налаштування магазину, покупець тут безсилий.
    console.error("[CRM payment link]", error instanceof CrmError
      ? { code: error.code, status: error.status, requestId: error.requestId }
      : { code: "UNKNOWN" });
    if (status === 409) {
      return Response.json({ error: "Онлайн-оплата тимчасово недоступна. Ми зв'яжемося з вами." }, { status: 503 });
    }
    return Response.json({ error: "Не вдалося підготувати платіжне посилання." }, { status: 502 });
  }
}
