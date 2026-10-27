"use client";

import { use, useLayoutEffect, useRef } from "react";
import { ComboBoxStateContext } from "react-aria-components/ComboBox";
import { ComboBox } from "@heroui/react/combo-box";
import { Description } from "@heroui/react/description";
import { FieldError } from "@heroui/react/field-error";
import { Input } from "@heroui/react/input";
import { Label } from "@heroui/react/label";
import { ListBox } from "@heroui/react/list-box";
import styles from "./combobox.module.css";

export type ComboboxOption = { value: string; label: string };
type Props = {
  label: string;
  name?: string;
  placeholder: string;
  options: ComboboxOption[];
  selected: ComboboxOption | null;
  onSelect: (option: ComboboxOption | null) => void;
  onQueryChange: (query: string) => void;
  disabled?: boolean;
  loading?: boolean;
  hint?: string;
  emptyMessage: string;
};

function CloseHiddenComboBox() {
  const state = use(ComboBoxStateContext);
  const latest = useRef(state);
  useLayoutEffect(() => { latest.current = state; });
  useLayoutEffect(() => () => latest.current?.close(), []);
  return null;
}

export function Combobox({ label, name, placeholder, options, selected, onSelect, onQueryChange,
  disabled = false, loading = false, hint, emptyMessage }: Props) {
  // Loading must remove stale items from the keyboard collection as well as the screen.
  const available = loading ? [] : options;
  const items = selected && !available.some((option) => option.value === selected.value)
    ? [selected, ...available] : available;

  return (
    <ComboBox
      className={styles.field}
      name={name}
      value={selected?.value ?? null}
      onChange={(key) => {
        const option = available.find((item) => item.value === key) ?? null;
        if (key === null || (!loading && option)) onSelect(option);
      }}
      onInputChange={onQueryChange}
      items={items}
      isRequired
      isDisabled={disabled}
      allowsEmptyCollection
      menuTrigger="focus"
      variant="secondary"
      fullWidth
      validate={({ value }) => value ? null : "Оберіть варіант зі списку"}
    >
      <CloseHiddenComboBox />
      <Label className={styles.label}>{label}</Label>
      <ComboBox.InputGroup className={styles.inputGroup}>
        <Input className={styles.input} placeholder={placeholder} autoComplete="off" aria-busy={loading || undefined} />
        <ComboBox.Trigger className={styles.trigger} aria-label={`Показати варіанти: ${label}`} />
      </ComboBox.InputGroup>
      {hint ? <Description className={styles.hint}>{hint}</Description> : null}
      <FieldError className={styles.error} />
      <ComboBox.Popover className={styles.menu} placement="bottom start" offset={6} containerPadding={12} maxHeight={280}>
        <ListBox className={styles.listBox} aria-label={label} renderEmptyState={() => (
          <p className={styles.status} role="status">{loading ? "Шукаємо…" : emptyMessage}</p>
        )}>
          {(option: ComboboxOption) => (
            <ListBox.Item id={option.value} textValue={option.label} className={styles.option}>
              <Label>{option.label}</Label>
              <ListBox.ItemIndicator className={styles.check} />
            </ListBox.Item>
          )}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}
