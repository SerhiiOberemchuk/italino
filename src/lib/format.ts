const formatters = new Map<string, Intl.NumberFormat>();

/** «3 490 ₴» — без копійок, локаль uk-UA. */
export function formatPrice(amount: number, currency = "UAH"): string {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
    formatters.set(currency, formatter);
  }
  return formatter.format(amount);
}
