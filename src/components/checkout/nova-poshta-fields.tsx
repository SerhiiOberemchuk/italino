"use client";

import { useEffect, useState } from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  CITY_QUERY_MIN,
  SUGGESTION_LIMIT,
  type NovaPoshtaCity,
  type NovaPoshtaWarehouse,
} from "@/lib/shipping/nova-poshta";
import styles from "@/app/shop.module.css";

/** Скільки чекати після останньої натиснутої клавіші, перш ніж питати CRM. */
const SEARCH_DELAY_MS = 300;

function aborted(reason: unknown): boolean {
  return reason instanceof DOMException && reason.name === "AbortError";
}

/**
 * Вибір пункту отримання з довідника Нової Пошти.
 *
 * У форму йдуть і підписи, і ідентифікатори. `cityRef` + `branchRef` дають CRM
 * створити накладну прямо з замовлення, без жодного вгадування; підписи —
 * для людей у картці замовлення й запасний шлях, якщо ідентифікатор загубиться.
 */
export function NovaPoshtaFields() {
  const [cityQuery, setCityQuery] = useState("");
  const [cityOptions, setCityOptions] = useState<ComboboxOption[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [city, setCity] = useState<ComboboxOption | null>(null);
  const [error, setError] = useState("");

  const searching = cityQuery.trim().length >= CITY_QUERY_MIN;

  // Пошук міста: із затримкою після введення й зі скасуванням попереднього
  // запиту — довідник CRM має спільний на всіх відвідувачів ліміт.
  useEffect(() => {
    if (!searching) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setCityLoading(true);
      fetch(`/api/shipping/cities?q=${encodeURIComponent(cityQuery.trim())}`, { signal: controller.signal })
        .then(async (response) => {
          const result = await response.json() as { cities?: NovaPoshtaCity[]; error?: string };
          if (!response.ok) throw new Error(result.error);
          setError("");
          setCityOptions((result.cities ?? [])
            .slice(0, SUGGESTION_LIMIT)
            .map((item) => ({ value: item.ref, label: item.label })));
        })
        .catch((reason: unknown) => {
          if (aborted(reason)) return;
          setError("Не вдалося завантажити список міст. Спробуйте ще раз або напишіть нам.");
        })
        .finally(() => setCityLoading(false));
    }, SEARCH_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cityQuery, searching]);

  return (
    <>
      <input type="hidden" name="city" value={city?.label ?? ""} />
      <input type="hidden" name="cityRef" value={city?.value ?? ""} />

      <Combobox
        label="Місто"
        placeholder="Почніть вводити назву"
        // Поки запит закороткий, попередні підказки показувати нічого.
        options={searching ? cityOptions : []}
        selected={city}
        onSelect={setCity}
        onQueryChange={setCityQuery}
        loading={searching && cityLoading}
        emptyMessage={searching
          ? "Такого міста немає в довіднику Нової Пошти"
          : "Введіть щонайменше дві літери"}
      />

      {/* Ключ за містом: зміна міста має лишити поле порожнім, а не з чужим
          відділенням. Перемонтування скидає і список, і вибір — без жодного
          ручного setState в ефекті. */}
      <WarehouseField key={city?.value ?? "no-city"} city={city} onError={setError} />

      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </>
  );
}

/** Нова Пошта показує в пошуку й населені пункти без жодної відкритої точки. */
const NO_POINTS_IN_CITY =
  "Нова Пошта зараз не має тут відділень і поштоматів. Оберіть найближчий населений пункт, де вони є.";

type WarehousePage = {
  /** Запит, на який ця сторінка — відповідь; поки він не збігається з поточним, іде пошук. */
  query: string;
  items: ComboboxOption[];
  total: number;
  failed: boolean;
};

function WarehouseField({ city, onError }: { city: ComboboxOption | null; onError: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState<WarehousePage | null>(null);
  const [selected, setSelected] = useState<ComboboxOption | null>(null);
  const search = query.trim();

  // Шукає CRM по всьому місту: у великому місті тисячі точок, тож перша сторінка
  // без запиту — це не «всі відділення». Перша сторінка — одразу, пошук — після
  // паузи в наборі.
  useEffect(() => {
    if (!city) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ cityRef: city.value });
      if (search) params.set("q", search);
      fetch(`/api/shipping/warehouses?${params}`, { signal: controller.signal })
        .then(async (response) => {
          const result = await response.json() as {
            warehouses?: NovaPoshtaWarehouse[];
            total?: number;
            error?: string;
          };
          if (!response.ok) throw new Error(result.error);
          const items = (result.warehouses ?? []).map((item) => ({ value: item.ref, label: item.label }));
          setPage({ query: search, items, total: result.total ?? items.length, failed: false });
        })
        .catch((reason: unknown) => {
          if (aborted(reason)) return;
          setPage({ query: search, items: [], total: 0, failed: true });
          onError("Не вдалося завантажити відділення цього міста. Спробуйте ще раз або напишіть нам.");
        });
    }, search ? SEARCH_DELAY_MS : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [city, search, onError]);

  const loading = city !== null && page?.query !== search;
  const items = page?.items ?? [];
  // Порожня відповідь на порожній запит — це саме місто, а не невдалий пошук.
  const noPointsInCity = !loading && page !== null && !page.failed && page.query === "" && page.total === 0;

  return (
    <>
      <input type="hidden" name="branch" value={selected?.label ?? ""} />
      <input type="hidden" name="branchRef" value={selected?.value ?? ""} />
      <Combobox
        label="Відділення або поштомат"
        placeholder={city ? "Номер або вулиця" : "Спершу оберіть місто"}
        options={items.slice(0, SUGGESTION_LIMIT)}
        selected={selected}
        onSelect={setSelected}
        onQueryChange={setQuery}
        disabled={!city}
        loading={loading}
        hint={noPointsInCity
          ? NO_POINTS_IN_CITY
          : page && page.total > items.length
            ? `Показано ${items.length} з ${page.total} — введіть номер або вулицю`
            : undefined}
        emptyMessage={page?.failed
          ? "Не вдалося завантажити відділення"
          : noPointsInCity
            ? NO_POINTS_IN_CITY
            : "Нічого не знайшли — спробуйте інший номер або вулицю"}
      />
    </>
  );
}
