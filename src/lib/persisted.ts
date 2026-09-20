"use client";

import { createJSONStorage, type PersistStorage } from "zustand/middleware";

/**
 * Сховище для `persist` з одноразовим підхопленням попереднього формату:
 * до переходу на zustand кошик і добірка лежали в localStorage голими
 * масивами під власними ключами.
 *
 * Підміна саме на рівні storage віддає zustand цілісний стан одразу під час
 * регідрації — на відміну від дочитування в `onRehydrateStorage`, яке робить
 * зайвий `set` уже після того, як стан став видимим для компонентів.
 *
 * Усі звернення до localStorage загорнуті: у приватному режимі або із
 * заблокованими даними сайту він кидає виняток. zustand викликає `setItem`
 * синхронно всередині `set()`, тож без цього кожне «Додати в кошик» падало б.
 * За такої відмови стор працює в пам'яті — просто без збереження.
 */
export function storageWithLegacyArray<T>(
  legacyKey: string,
  version: number,
  validate: (value: unknown) => T[],
): PersistStorage<{ items: T[] }> | undefined {
  return createJSONStorage<{ items: T[] }>(() => ({
    getItem: (name) => {
      try {
        const current = localStorage.getItem(name);
        if (current !== null) return current;

        const legacy = localStorage.getItem(legacyKey);
        if (legacy === null) return null;
        localStorage.removeItem(legacyKey);
        return JSON.stringify({ state: { items: validate(JSON.parse(legacy)) }, version });
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        localStorage.setItem(name, value);
      } catch {
        // Сховище недоступне або переповнене — стан лишається лише в пам'яті.
      }
    },
    removeItem: (name) => {
      try {
        localStorage.removeItem(name);
      } catch {
        // Те саме: нічого не зберігали — нічого й прибирати.
      }
    },
  }));
}
