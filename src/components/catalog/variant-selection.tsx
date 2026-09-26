"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { CrmProduct } from "@/lib/crm/types";
import { pickVariant } from "@/lib/catalog/variants";

/**
 * Обраний артикул моделі — спільний стан галереї й BuyBox. Живе тут, а не в
 * BuyBox, бо галерея й ціна/розмір мають реагувати на той самий вибір
 * незалежно одне від одного. React Compiler сам мемоізує значення контексту —
 * ручний `useMemo`/`useCallback` тут зайвий.
 */
type VariantSelectionContextValue = {
  variants: CrmProduct[];
  selected: CrmProduct;
  select: (sku: string) => void;
};

const VariantSelectionContext = createContext<VariantSelectionContextValue | null>(null);

/**
 * `?sku=` у адресному рядку — обраний варіант можна надіслати посиланням.
 * Читання йде через `useSearchParams()`, тому дерево під провайдером мусить
 * лежати всередині `<Suspense>` (сторінка товару вже так зроблена).
 */
export function VariantSelectionProvider({
  variants,
  children,
}: {
  variants: CrmProduct[];
  children: ReactNode;
}) {
  const searchParams = useSearchParams();

  const [sku, setSku] = useState(
    () => pickVariant(variants, { sku: searchParams.get("sku") }).sku ?? "",
  );

  const selected = pickVariant(variants, { sku });

  function select(nextSku: string) {
    setSku(nextSku);
    // Нативний replaceState, а не router.replace: Next синхронізує його з
    // useSearchParams, а навігація роутера на кожен клік по кольору ходила б
    // на сервер по ту саму сторінку. Решта параметрів (utm_* з реклами)
    // лишається — переписується лише sku.
    const params = new URLSearchParams(searchParams.toString());
    params.set("sku", nextSku);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }

  return (
    <VariantSelectionContext.Provider value={{ variants, selected, select }}>
      {children}
    </VariantSelectionContext.Provider>
  );
}

export function useVariantSelection(): VariantSelectionContextValue {
  const context = useContext(VariantSelectionContext);
  if (!context) throw new Error("useVariantSelection: немає VariantSelectionProvider вище по дереву");
  return context;
}
