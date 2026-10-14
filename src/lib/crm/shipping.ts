import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import {
  SUGGESTION_LIMIT,
  type NovaPoshtaCity,
  type NovaPoshtaWarehouse,
  type NovaPoshtaWarehousePage,
} from "@/lib/shipping/nova-poshta";
import { crmGet } from "./client";

/*
 * Довідники Нової Пошти живуть за адаптером CRM і мають ліміт 120 запитів на
 * хвилину — спільний на весь токен, тобто на всіх відвідувачів разом. Без кешу
 * десяток одночасних покупців вичерпав би його на автодоповненні.
 *
 * Міста й відділення змінюються рідко, тож тримаємо їх довго: майже всі
 * покупці шукають ті самі кілька десятків міст, і запит до CRM іде лише на
 * перший із них.
 */

export async function searchCities(query: string): Promise<NovaPoshtaCity[]> {
  "use cache";
  cacheLife("days");
  cacheTag("shipping", "np-cities");

  const result = await crmGet<{ data?: unknown }>("carriers/nova_poshta/cities", { q: query });
  if (!Array.isArray(result.data)) return [];
  return result.data.filter((city): city is NovaPoshtaCity => {
    const candidate = city as Partial<NovaPoshtaCity>;
    return typeof candidate.label === "string" && typeof candidate.ref === "string";
  });
}

/*
 * Точки міста ШУКАЄ CRM, а не віддає списком: у Києві їх понад 8 000 (здебільшого
 * поштомати), а без запиту CRM повертає лише першу сторінку. Колись сайт брав саме
 * її й фільтрував у браузері — тож більшість поштоматів знайти було неможливо, а
 * підказка називала 500 «усіма» відділеннями міста. `total` — скільки точок
 * відповідає запиту насправді.
 */
export async function searchWarehouses(
  cityRef: string,
  query: string,
): Promise<NovaPoshtaWarehousePage> {
  "use cache";
  cacheLife("days");
  cacheTag("shipping", "np-warehouses");

  const result = await crmGet<{ data?: unknown; pagination?: { total?: unknown } }>(
    "carriers/nova_poshta/warehouses",
    { cityRef, perPage: SUGGESTION_LIMIT, q: query || undefined },
  );
  const items = Array.isArray(result.data)
    ? result.data.filter((warehouse): warehouse is NovaPoshtaWarehouse => {
        const candidate = warehouse as Partial<NovaPoshtaWarehouse>;
        return typeof candidate.label === "string" && typeof candidate.ref === "string";
      })
    : [];
  const total = result.pagination?.total;
  return { items, total: typeof total === "number" ? total : items.length };
}
