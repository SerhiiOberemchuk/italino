"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/cart";
import { useFavoritesStore } from "@/lib/favorites";

/**
 * Обидва persist-стори створені зі `skipHydration`, щоб перший клієнтський
 * рендер збігався з серверним HTML. Читання localStorage починається тут —
 * уже після гідрації React; далі компоненти чекають на прапорець `hydrated`.
 */
export function StoreHydrator() {
  useEffect(() => {
    /*
     * Прапорець піднімаємо і тоді, коли сховище віддало помилку: zustand у
     * такому разі викликає onRehydrateStorage без стану, і вітрина назавжди
     * лишилася б на «Завантажуємо…».
     */
    async function hydrate(rehydrate: () => Promise<void> | void, markHydrated: () => void) {
      try {
        await rehydrate();
      } catch {
        // localStorage недоступний — працюємо з порожнім станом.
      }
      markHydrated();
    }

    void hydrate(() => useCartStore.persist.rehydrate(), useCartStore.getState().markHydrated);
    void hydrate(() => useFavoritesStore.persist.rehydrate(), useFavoritesStore.getState().markHydrated);
  }, []);

  return null;
}
