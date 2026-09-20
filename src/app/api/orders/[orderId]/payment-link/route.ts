import { getOrCreatePaymentLink } from "@/lib/crm/orders";
import { CrmError } from "@/lib/crm/client";

type Context = { params: Promise<{ orderId: string }> };

export async function POST(_request: Request, { params }: Context) {
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
