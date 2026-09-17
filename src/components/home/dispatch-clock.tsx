"use client";

import { useSyncExternalStore } from "react";
import {
  formatDispatchDate,
  nextCutoff,
  nextDispatch,
  splitCountdown,
} from "@/lib/shipping/schedule";
import styles from "./dispatch-clock.module.css";

/*
 * Поточний час не читається під час серверного рендеру (Cache Components
 * prerender-ять сторінку). На сервері показуємо fallback, на клієнті —
 * реальні дати через useSyncExternalStore без setState в ефектах.
 */

function subscribeNever() {
  return () => {};
}

function subscribeEverySecond(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

function nowInSeconds() {
  return Math.floor(Date.now() / 1000) * 1000;
}

function serverSnapshot() {
  return null;
}

/** Дата найближчої відправки з Мілана: «неділя, 20 вересня». */
export function NextDispatchDate({
  fallback,
  className,
}: {
  fallback: string;
  className?: string;
}) {
  const dispatchTime = useSyncExternalStore(
    subscribeNever,
    () => nextDispatch(new Date()).getTime(),
    serverSnapshot,
  );
  const label =
    dispatchTime === null ? fallback : formatDispatchDate(new Date(dispatchTime));
  return <span className={className}>{label}</span>;
}

const CELLS: { key: keyof ReturnType<typeof splitCountdown>; label: string }[] = [
  { key: "days", label: "дн" },
  { key: "hours", label: "год" },
  { key: "minutes", label: "хв" },
  { key: "seconds", label: "с" },
];

/** Зворотний відлік до закриття прийому замовлень у поточну поставку. */
export function CutoffCountdown() {
  const now = useSyncExternalStore(subscribeEverySecond, nowInSeconds, serverSnapshot);
  const parts = now === null ? null : splitCountdown(nextCutoff(new Date(now)).getTime() - now);

  return (
    <div className={styles.countdown} role="timer" aria-live="off">
      <p className={styles.label}>До закриття прийому замовлень</p>
      <div className={styles.cells}>
        {CELLS.map((cell) => (
          <div key={cell.key} className={styles.cell}>
            <strong>{parts ? String(parts[cell.key]).padStart(2, "0") : "––"}</strong>
            <span>{cell.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
