"use client";

import { useEffect, useState } from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { CITY_QUERY_MIN, SUGGESTION_LIMIT } from "@/lib/shipping/nova-poshta";
import styles from "@/app/shop.module.css";

const SEARCH_DELAY_MS = 300;
type DirectoryPage = { url: string; items: ComboboxOption[]; total: number; failed: boolean };

/** Results belong to one exact URL. Abort alone is insufficient once response parsing has started. */
function useDirectoryPage(url: string | null, collection: "cities" | "warehouses", delay: number) {
  const [page, setPage] = useState<DirectoryPage | null>(null);
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(url, { signal: controller.signal });
        const data = await response.json() as {
          cities?: { ref: string; label: string }[];
          warehouses?: { ref: string; label: string }[];
          total?: number;
        };
        if (!response.ok) throw new Error("Directory request failed");
        if (controller.signal.aborted) return;
        const items = (data[collection] ?? []).map((item) => ({ value: item.ref, label: item.label }));
        setPage({ url, items, total: data.total ?? items.length, failed: false });
      } catch {
        if (!controller.signal.aborted) setPage({ url, items: [], total: 0, failed: true });
      }
    }, delay);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [url, collection, delay]);
  const current = url && page?.url === url ? page : null;
  return { items: current?.items ?? [], total: current?.total ?? 0,
    failed: current?.failed ?? false, loading: Boolean(url && !current) };
}

export function NovaPoshtaFields() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<ComboboxOption | null>(null);
  const searching = query.trim().length >= CITY_QUERY_MIN;
  const page = useDirectoryPage(searching ? `/api/shipping/cities?q=${encodeURIComponent(query.trim())}` : null,
    "cities", SEARCH_DELAY_MS);
  return (
    <>
      <input type="hidden" name="city" value={city?.label ?? ""} />
      <Combobox
        name="cityRef"
        label="Місто"
        placeholder="Почніть вводити назву"
        options={page.items.slice(0, SUGGESTION_LIMIT)}
        selected={city}
        onSelect={setCity}
        onQueryChange={setQuery}
        loading={page.loading}
        emptyMessage={!searching ? "Введіть щонайменше дві літери" : page.failed
          ? "Не вдалося завантажити міста. Спробуйте ще раз."
          : "Такого міста немає в довіднику Нової Пошти"}
      />
      <WarehouseField key={city?.value ?? "no-city"} city={city} />
      {page.failed ? <p className={styles.error} role="alert">Не вдалося завантажити список міст. Спробуйте ще раз або напишіть нам.</p> : null}
    </>
  );
}

const NO_POINTS_IN_CITY = "Нова Пошта зараз не має тут відділень і поштоматів. Оберіть найближчий населений пункт, де вони є.";

function WarehouseField({ city }: { city: ComboboxOption | null }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ComboboxOption | null>(null);
  const search = query.trim();
  const params = new URLSearchParams({ cityRef: city?.value ?? "" });
  if (search) params.set("q", search);
  const page = useDirectoryPage(city ? `/api/shipping/warehouses?${params}` : null,
    "warehouses", search ? SEARCH_DELAY_MS : 0);
  const noPoints = city && !search && !page.loading && !page.failed && page.total === 0;
  return (
    <>
      <input type="hidden" name="branch" value={selected?.label ?? ""} />
      <Combobox
        name="branchRef"
        label="Відділення або поштомат"
        placeholder={city ? "Номер або вулиця" : "Спершу оберіть місто"}
        options={page.items.slice(0, SUGGESTION_LIMIT)}
        selected={selected}
        onSelect={setSelected}
        onQueryChange={setQuery}
        disabled={!city}
        loading={page.loading}
        hint={noPoints ? NO_POINTS_IN_CITY : page.total > page.items.length
          ? `Показано ${page.items.length} з ${page.total} — введіть номер або вулицю` : undefined}
        emptyMessage={page.failed ? "Не вдалося завантажити відділення" : noPoints
          ? NO_POINTS_IN_CITY : "Нічого не знайшли — спробуйте інший номер або вулицю"}
      />
      {page.failed ? <p className={styles.error} role="alert">Не вдалося завантажити відділення цього міста. Спробуйте ще раз або напишіть нам.</p> : null}
    </>
  );
}
