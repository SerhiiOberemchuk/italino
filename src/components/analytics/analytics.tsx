"use client";

import Clarity from "@microsoft/clarity";
import { GoogleAnalytics } from "@next/third-parties/google";
import { useEffect, useSyncExternalStore } from "react";
import { CLARITY_PROJECT_ID, GA_MEASUREMENT_ID } from "@/lib/analytics";

function subscribeNever() {
  return () => {};
}

/**
 * Microsoft Clarity й Google Analytics — лише на продакшн-домені.
 *
 * Хост порівнюємо в браузері, а не за NODE_ENV: локальний `next start` і
 * preview-деплої теж продакшн-збірки, і без цього в записи й звіти потрапляли б
 * наші власні перевірки. На сервері відповідь завжди «ні» — аналітика
 * з'являється після гідрації, як і рекомендує Next для обох інструментів.
 *
 * Що збирається, описано в політиці конфіденційності; форма оформлення й
 * сторінка замовлення маскуються для Clarity атрибутом `data-clarity-mask`.
 */
export function Analytics({ host }: { host: string }) {
  const enabled = useSyncExternalStore(
    subscribeNever,
    () => window.location.hostname.replace(/^www\./, "") === host,
    () => false,
  );

  useEffect(() => {
    // `init` ідемпотентний — повторний виклик скрипт не дублює.
    if (enabled) Clarity.init(CLARITY_PROJECT_ID);
  }, [enabled]);

  return enabled ? <GoogleAnalytics gaId={GA_MEASUREMENT_ID} /> : null;
}
