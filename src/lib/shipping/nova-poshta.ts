/** Форми довідників Нової Пошти — спільні для серверних запитів і форми чекауту. */

export type NovaPoshtaCity = {
  /** «м. Київ, Київська обл.» — канонічний підпис Нової Пошти. */
  label: string;
  ref: string;
  settlementRef: string;
};

export type NovaPoshtaWarehouse = {
  /** «Відділення №5: вул. Богатирська, 11». */
  label: string;
  number: string;
  ref: string;
};

/** Одна сторінка пошуку точок міста; `total` — скільки їх відповідає запиту. */
export type NovaPoshtaWarehousePage = {
  items: NovaPoshtaWarehouse[];
  total: number;
};

/** Від якої довжини запиту має сенс шукати місто. */
export const CITY_QUERY_MIN = 2;

/** Скільки варіантів показувати у списку; решту покупець відсіє уточненням. */
export const SUGGESTION_LIMIT = 50;
