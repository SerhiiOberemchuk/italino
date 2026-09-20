"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import styles from "./custom-select.module.css";

export type SelectOption = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  label: string;
  name: string;
  value: string;
  options: SelectOption[];
};

export function CustomSelect({ label, name, value, options }: CustomSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === selectedValue));
  const selected = options[selectedIndex] ?? options[0];

  /*
   * Cache Components ховають маршрут через <Activity> замість розмонтування,
   * тож відкритий список пережив би перехід і повернення на сторінку. Для
   * транзієнтного popover це неочікувано — закриваємо синхронно перед тим,
   * як маршрут стане прихованим.
   */
  useLayoutEffect(() => () => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    optionRefs.current[selectedIndex]?.focus();
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open, selectedIndex]);

  function choose(nextValue: string) {
    setSelectedValue(nextValue);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, direction: 1 | -1) {
    event.preventDefault();
    const current = optionRefs.current.indexOf(event.currentTarget);
    const next = (current + direction + options.length) % options.length;
    optionRefs.current[next]?.focus();
  }

  return (
    <div
      className={styles.field}
      ref={rootRef}
      onBlur={() => {
        requestAnimationFrame(() => {
          if (!rootRef.current?.contains(document.activeElement)) setOpen(false);
        });
      }}
    >
      <span className={styles.label} id={`${id}-label`}>{label}</span>
      <input type="hidden" name={name} value={selectedValue} />
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span id={`${id}-value`}>{selected?.label}</span>
        <span className={styles.chevron} aria-hidden="true" />
      </button>
      {open ? (
        <div className={styles.menu} id={`${id}-listbox`} role="listbox" aria-labelledby={`${id}-label`}>
          {options.map((option, index) => {
            const active = option.value === selectedValue;
            return (
              <button
                key={option.value}
                ref={(node) => { optionRefs.current[index] = node; }}
                type="button"
                role="option"
                aria-selected={active}
                className={active ? `${styles.option} ${styles.optionActive}` : styles.option}
                onClick={() => choose(option.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") moveFocus(event, 1);
                  if (event.key === "ArrowUp") moveFocus(event, -1);
                  if (event.key === "Home") {
                    event.preventDefault();
                    optionRefs.current[0]?.focus();
                  }
                  if (event.key === "End") {
                    event.preventDefault();
                    optionRefs.current.at(-1)?.focus();
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setOpen(false);
                    requestAnimationFrame(() => triggerRef.current?.focus());
                  }
                }}
              >
                <span>{option.label}</span>
                {active ? <span className={styles.check} aria-hidden="true">✓</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
