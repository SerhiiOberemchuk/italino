"use client";

import { createContext, use, useContext, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { CrmProduct } from "@/lib/crm/types";
import { pickVariant } from "@/lib/catalog/variants";

/**
 * Обраний артикул моделі — спільний стан галереї й BuyBox. Живе тут, а не в
 * BuyBox, бо галерея й ціна/розмір мають реагувати на той самий вибір
 * незалежно одне від одного. React Compiler сам мемоізує значення контексту —
 * ручний `useMemo`/`useCallback` тут зайвий.
 *
 * Варіанти приходять промісом: провайдер не чекає на них, тож сітка сторінки
 * товару малюється одразу, а галерея й BuyBox розгортають дані через `use()`
 * кожен у своєму `<Suspense>` зі скелетоном.
 */
type VariantSelectionContextValue = {
  variants: Promise<CrmProduct[]>;
  /** Артикул, який обрали на сторінці; `null` — діє `?sku=` з адреси. */
  chosenSku: string | null;
  select: (sku: string) => void;
};

const VariantSelectionContext = createContext<VariantSelectionContextValue | null>(null);

export function VariantSelectionProvider({
  variants,
  children,
}: {
  variants: Promise<CrmProduct[]>;
  children: ReactNode;
}) {
  const [chosenSku, setChosenSku] = useState<string | null>(null);

  function select(nextSku: string) {
    setChosenSku(nextSku);
    // Нативний replaceState, а не router.replace: Next синхронізує його з
    // useSearchParams, а навігація роутера на кожен клік по кольору ходила б
    // на сервер по ту саму сторінку. Решта параметрів (utm_* з реклами)
    // лишається — переписується лише sku.
    const params = new URLSearchParams(window.location.search);
    params.set("sku", nextSku);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }

  return (
    <VariantSelectionContext.Provider value={{ variants, chosenSku, select }}>
      {children}
    </VariantSelectionContext.Provider>
  );
}

/**
 * `?sku=` у адресному рядку — обраний варіант можна надіслати посиланням.
 * Хук чекає на варіанти й читає `useSearchParams()`, тому компонент, що його
 * викликає, мусить лежати у власному `<Suspense>`.
 */
export function useVariantSelection(): { variants: CrmProduct[]; selected: CrmProduct; select: (sku: string) => void } {
  const context = useContext(VariantSelectionContext);
  if (!context) throw new Error("useVariantSelection: немає VariantSelectionProvider вище по дереву");
  const variants = use(context.variants);
  const searchParams = useSearchParams();
  const selected = pickVariant(variants, { sku: context.chosenSku ?? searchParams.get("sku") });
  return { variants, selected, select: context.select };
}
