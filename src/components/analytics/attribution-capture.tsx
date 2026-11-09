"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/** Запам'ятовує рекламні мітки з адреси заходу; нічого не рендерить. */
export function AttributionCapture() {
  useEffect(() => {
    try {
      captureAttribution(window.location.search, window.localStorage);
    } catch {
      // localStorage може кидати (приватний режим) — атрибуція тоді просто не збережеться.
    }
  }, []);
  return null;
}
