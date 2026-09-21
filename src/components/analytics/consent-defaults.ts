/**
 * Згода Google за замовчуванням — має потрапити в dataLayer раніше за
 * `gtag('config')`, тому йде окремим скриптом `beforeInteractive`.
 *
 * - Рекламне сховище вимкнено скрізь: реклами на сайті немає, і політика
 *   конфіденційності обіцяє, що рекламних cookie немає.
 * - Аналітичні cookie вимкнено для ЄЕЗ, Великої Британії та Швейцарії — так само
 *   поводиться й Clarity без сигналу згоди. Банера згоди немає, тож для цих
 *   країн GA працює без cookie. Для України та решти світу — звичайний режим.
 *
 * `gtag` оголошено всередині IIFE: глобальний `window.gtag` означає, що GA
 * справді підключено, і на цьому стоїть перевірка в `trackEvent()`.
 */
const CONSENT_REGIONS = [
  // ЄС
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // решта ЄЕЗ, Британія, Швейцарія
  "IS", "LI", "NO", "GB", "CH",
];

export const CONSENT_DEFAULTS_SCRIPT = `(function () {
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted"
  });
  gtag("consent", "default", {
    analytics_storage: "denied",
    region: ${JSON.stringify(CONSENT_REGIONS)}
  });
})();`;
