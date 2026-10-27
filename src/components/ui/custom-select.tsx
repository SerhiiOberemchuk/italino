"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Header } from "@heroui/react/header";
import { Label } from "@heroui/react/label";
import { ListBox } from "@heroui/react/list-box";
import { Select } from "@heroui/react/select";
import styles from "./custom-select.module.css";

export type SelectOption<Value extends string = string> = {
  id?: string;
  value: Value;
  label: string;
  /** Вкладеність категорії з CRM. */
  depth?: number;
};

type MenuItem<Value extends string> = SelectOption<Value> & { id: string };
type MenuGroup<Value extends string> = { id: string; title?: string; items: MenuItem<Value>[] };

type CustomSelectProps<Value extends string> = {
  label: string;
  name: string;
  value: Value;
  options: SelectOption<Value>[];
  onValueChange: (value: Value) => void;
};

/** Секції HeroUI зберігають дерево CRM та окремий вибір батьківської категорії. */
function groupOptions<Value extends string>(items: MenuItem<Value>[]): MenuGroup<Value>[] {
  const groups: MenuGroup<Value>[] = [];
  let current: MenuGroup<Value> | undefined;
  for (const item of items) {
    if (!current || !item.depth) {
      current = { id: `section-${item.id}`, title: item.depth === 0 ? item.label : undefined, items: [] };
      groups.push(current);
    }
    current.items.push(item);
  }
  return groups;
}

export function CustomSelect<Value extends string>({ label, name, value, options, onValueChange }: CustomSelectProps<Value>) {
  const [open, setOpen] = useState(false);
  const listBoxRef = useRef<HTMLDivElement>(null);
  // ID пункту відокремлений від URL: різні CRM-категорії можуть мати однаковий slug.
  const items = options.map((option, index) => ({ ...option, id: option.id ?? `${name}-${index}` }));
  const groups = groupOptions(items);
  const selected = items.find((option) => option.value === value) ?? items[0];

  // Cache Components ховають маршрут через Activity: не відновлюємо відкритий список.
  useLayoutEffect(() => () => setOpen(false), []);

  useLayoutEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const listBox = listBoxRef.current;
      const option = listBox?.querySelector<HTMLElement>('[aria-selected="true"]');
      if (listBox && option) {
        listBox.scrollTop += option.getBoundingClientRect().top - listBox.getBoundingClientRect().top
          - (listBox.clientHeight - option.offsetHeight) / 2;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  function renderItem(option: MenuItem<Value>, isGroupParent = false) {
    return (
      <ListBox.Item
        key={option.id}
        id={option.id}
        textValue={option.label}
        className={styles.option}
        style={{ paddingInlineStart: 11 + Math.max(0, Math.min(4, option.depth ?? 0) - 1) * 14 }}
      >
        <Label className={styles.optionLabel}>{isGroupParent ? "Усі товари категорії" : option.label}</Label>
        <ListBox.ItemIndicator className={styles.check} />
      </ListBox.Item>
    );
  }

  return (
    <Select
      className={styles.field}
      variant="secondary"
      fullWidth
      value={selected?.id ?? null}
      onChange={(id) => {
        const option = items.find((item) => item.id === id);
        if (option) onValueChange(option.value);
      }}
      isOpen={open}
      onOpenChange={setOpen}
      isDisabled={!items.length}
    >
      <Label className={styles.label}>{label}</Label>
      <input type="hidden" name={name} value={value} />
      <Select.Trigger className={styles.trigger}>
        <Select.Value className={styles.value}>{selected?.label}</Select.Value>
        <Select.Indicator className={styles.chevron} />
      </Select.Trigger>
      <Select.Popover
        className={styles.menu}
        placement="bottom start"
        offset={6}
        containerPadding={12}
        maxHeight={360}
        scrollRef={listBoxRef}
        shouldFlip
      >
        <ListBox ref={listBoxRef} className={styles.listBox} aria-label={label}>
          {groups.map((group) => group.title && group.items.length > 1 ? (
            <ListBox.Section key={group.id} className={styles.section}>
              <Header className={styles.sectionHeader}>{group.title}</Header>
              {group.items.map((option, index) => renderItem(option, index === 0))}
            </ListBox.Section>
          ) : group.items.map((option) => renderItem(option)))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
