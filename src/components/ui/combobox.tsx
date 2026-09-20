"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import styles from "./combobox.module.css";

export type ComboboxOption = { value: string; label: string };

type Props = {
  label: string;
  placeholder: string;
  options: ComboboxOption[];
  selected: ComboboxOption | null;
  onSelect: (option: ComboboxOption | null) => void;
  /** Викликається на кожну зміну тексту; батько сам вирішує — шукати чи фільтрувати. */
  onQueryChange: (query: string) => void;
  disabled?: boolean;
  loading?: boolean;
  hint?: string;
  emptyMessage: string;
};

export function Combobox({
  label, placeholder, options, selected, onSelect, onQueryChange,
  disabled = false, loading = false, hint, emptyMessage,
}: Props) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(selected?.label ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  /*
   * Cache Components ховають маршрут через <Activity> замість розмонтування,
   * тож відкритий список пережив би перехід і повернення на сторінку.
   */
  useEffect(() => () => setOpen(false), []);

  function commit(option: ComboboxOption) {
    onSelect(option);
    setQuery(option.label);
    setOpen(false);
  }

  function change(value: string) {
    setQuery(value);
    setActiveIndex(0);
    setOpen(true);
    // Недописаний текст — це ще не вибір; порожнє приховане поле зупинить сабміт.
    if (selected) onSelect(null);
    onQueryChange(value);
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return setOpen(true);
      if (!options.length) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => (current + step + options.length) % options.length);
      return;
    }
    if (event.key === "Enter" && open && options[activeIndex]) {
      event.preventDefault();
      commit(options[activeIndex]);
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  const listboxId = `${id}-listbox`;
  const showMenu = open && !disabled;

  return (
    <div className={styles.field} ref={rootRef}>
      <label className={styles.label} htmlFor={`${id}-input`}>{label}</label>
      <input
        id={`${id}-input`}
        className={styles.input}
        type="text"
        role="combobox"
        // Поле не має `name`: у форму значення віддає приховане поле батька,
        // і воно порожнє, доки покупець не обрав варіант зі списку.
        required
        disabled={disabled}
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        aria-expanded={showMenu}
        aria-controls={showMenu ? listboxId : undefined}
        aria-activedescendant={showMenu && options[activeIndex] ? `${id}-option-${activeIndex}` : undefined}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => change(event.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={keyDown}
        // Повертаємо підтверджений підпис: вільний текст тут нічого не означає.
        onBlur={() => setQuery(selected?.label ?? "")}
      />
      {hint ? <small className={styles.hint} id={`${id}-hint`}>{hint}</small> : null}

      {showMenu ? (
        <div className={styles.menu} id={listboxId} role="listbox" aria-label={label}>
          {loading ? (
            <p className={styles.status}>Шукаємо…</p>
          ) : options.length ? (
            options.map((option, index) => (
              <button
                key={option.value}
                id={`${id}-option-${index}`}
                type="button"
                role="option"
                aria-selected={option.value === selected?.value}
                className={index === activeIndex ? `${styles.option} ${styles.optionActive}` : styles.option}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => commit(option)}
                onPointerEnter={() => setActiveIndex(index)}
              >
                {option.label}
              </button>
            ))
          ) : (
            <p className={styles.status}>{emptyMessage}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
