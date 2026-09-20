import { listWarehouses } from "@/lib/crm/shipping";
import { allowRequest, clientKey } from "@/lib/rate-limit";

/** Усі відділення міста одним списком — у CRM цей ендпоінт не вміє шукати. */
export async function GET(request: Request) {
  if (!allowRequest(`np-warehouses:${clientKey(request)}`, 60)) {
    return Response.json({ error: "Забагато запитів. Спробуйте за хвилину." }, { status: 429 });
  }

  const cityRef = new URL(request.url).searchParams.get("cityRef")?.trim().slice(0, 100) ?? "";
  if (!cityRef) return Response.json({ warehouses: [] });

  try {
    return Response.json({ warehouses: await listWarehouses(cityRef) });
  } catch {
    return Response.json({ error: "Не вдалося завантажити відділення." }, { status: 502 });
  }
}
