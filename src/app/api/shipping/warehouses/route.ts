import { searchWarehouses } from "@/lib/crm/shipping";
import { allowRequest, clientKey } from "@/lib/rate-limit";

/**
 * Посередник до пошуку точок міста: номер відділення чи поштомату або частина
 * адреси; без `q` — перша сторінка міста. CRM шукає по всьому місту і каже,
 * скільки точок відповідає запиту.
 */
export async function GET(request: Request) {
  if (!allowRequest(`np-warehouses:${clientKey(request)}`, 60)) {
    return Response.json({ error: "Забагато запитів. Спробуйте за хвилину." }, { status: 429 });
  }

  const params = new URL(request.url).searchParams;
  const cityRef = params.get("cityRef")?.trim().slice(0, 100) ?? "";
  const query = params.get("q")?.trim().slice(0, 100) ?? "";
  if (!cityRef) return Response.json({ warehouses: [], total: 0 });

  try {
    const page = await searchWarehouses(cityRef, query);
    return Response.json({ warehouses: page.items, total: page.total });
  } catch {
    return Response.json({ error: "Не вдалося завантажити відділення." }, { status: 502 });
  }
}
