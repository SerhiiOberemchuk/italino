import { searchCities } from "@/lib/crm/shipping";
import { CITY_QUERY_MIN } from "@/lib/shipping/nova-poshta";
import { allowRequest, clientKey } from "@/lib/rate-limit";

/** Посередник до довідника міст: Bearer-токен CRM не має потрапляти в браузер. */
export async function GET(request: Request) {
  if (!allowRequest(`np-cities:${clientKey(request)}`, 60)) {
    return Response.json({ error: "Забагато запитів. Спробуйте за хвилину." }, { status: 429 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (query.length < CITY_QUERY_MIN) return Response.json({ cities: [] });

  try {
    return Response.json({ cities: await searchCities(query) });
  } catch {
    return Response.json({ error: "Не вдалося завантажити міста." }, { status: 502 });
  }
}
