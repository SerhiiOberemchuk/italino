import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import type { NovaPoshtaCity, NovaPoshtaWarehouse } from "@/lib/shipping/nova-poshta";
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

export async function listWarehouses(cityRef: string): Promise<NovaPoshtaWarehouse[]> {
  "use cache";
  cacheLife("days");
  cacheTag("shipping", "np-warehouses");

  const result = await crmGet<{ data?: unknown }>("carriers/nova_poshta/warehouses", { cityRef });
  if (!Array.isArray(result.data)) return [];
  return result.data.filter((warehouse): warehouse is NovaPoshtaWarehouse => {
    const candidate = warehouse as Partial<NovaPoshtaWarehouse>;
    return typeof candidate.label === "string" && typeof candidate.ref === "string";
  });
}
