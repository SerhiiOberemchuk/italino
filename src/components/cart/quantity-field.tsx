"use client";

import { NumberField } from "@heroui/react/number-field";
import styles from "@/app/shop.module.css";

type Props = { value: number; max?: number | null; label: string; onChange: (value: number) => void };
export function QuantityField({ value, max, label, onChange }: Props) {
  const upper = Math.max(1, Math.min(99, Math.floor(max ?? 99)));
  return (
    <NumberField aria-label={label} value={value} minValue={1} maxValue={upper} step={1}
      isDisabled={max !== null && max !== undefined && max < 1}
      formatOptions={{ maximumFractionDigits: 0, useGrouping: false }}
      onChange={(next) => { if (Number.isInteger(next) && next >= 1 && next <= upper) onChange(next); }}>
      <NumberField.Group className={styles.qty}>
        <NumberField.DecrementButton aria-label="Зменшити кількість" />
        <NumberField.Input inputMode="numeric" />
        <NumberField.IncrementButton aria-label="Збільшити кількість" />
      </NumberField.Group>
    </NumberField>
  );
}
