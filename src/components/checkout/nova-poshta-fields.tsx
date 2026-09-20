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
 * У форму значення віддають приховані поля з канонічними підписами — саме їх
 * CRM зіставляє з живим довідником, коли створює накладну. Ідентифікатори
 * (`ref`) лишаються тут: схема замовлення в CRM їх не приймає.
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

function WarehouseField({ city, onError }: { city: ComboboxOption | null; onError: (message: string) => void }) {
  // null — ще не відповіли; порожній масив — відповіли, але нічого немає.
  const [warehouses, setWarehouses] = useState<ComboboxOption[] | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ComboboxOption | null>(null);

  // Відділення приходять усі разом: шукати вміє лише довідник міст.
  useEffect(() => {
    if (!city) return;

    const controller = new AbortController();
    fetch(`/api/shipping/warehouses?cityRef=${encodeURIComponent(city.value)}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as { warehouses?: NovaPoshtaWarehouse[]; error?: string };
        if (!response.ok) throw new Error(result.error);
        setWarehouses((result.warehouses ?? []).map((item) => ({ value: item.ref, label: item.label })));
      })
      .catch((reason: unknown) => {
        if (aborted(reason)) return;
        setWarehouses([]);
        onError("Не вдалося завантажити відділення цього міста. Спробуйте ще раз або напишіть нам.");
      });

    return () => controller.abort();
  }, [city, onError]);

  const loaded = warehouses ?? [];
  const needle = query.trim().toLocaleLowerCase("uk");
  const visible = (needle
    ? loaded.filter((item) => item.label.toLocaleLowerCase("uk").includes(needle))
    : loaded
  ).slice(0, SUGGESTION_LIMIT);

  return (
    <>
      <input type="hidden" name="branch" value={selected?.label ?? ""} />
      <Combobox
        label="Відділення або поштомат"
        placeholder={city ? "Номер або вулиця" : "Спершу оберіть місто"}
        options={visible}
        selected={selected}
        onSelect={setSelected}
        onQueryChange={setQuery}
        disabled={!city}
        loading={city !== null && warehouses === null}
        hint={loaded.length > SUGGESTION_LIMIT
          ? `У цьому місті ${loaded.length} відділень — введіть номер або вулицю`
          : undefined}
        emptyMessage="Нічого не знайшли — спробуйте інший номер або вулицю"
      />
    </>
  );
}
