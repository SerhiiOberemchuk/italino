import type { SVGProps } from "react";

/*
 * Знак Obriym CRM — технологічного партнера Italino.
 *
 * Контури взято дослівно з `obriym-mark-color.svg` бренд-набору CRM
 * (c:\GitHub\obriym-crm\public\brand\logo): це варіант для світлого тла без
 * `prefers-color-scheme`, а вітрина має лише світлу тему. Назву поруч
 * рендеримо живим текстом — так само робить і сама CRM. viewBox обрізано
 * до меж знака разом зі штрихом.
 */
export function ObriymMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="20 15 85 88" fill="none" aria-hidden="true" focusable="false" {...props}>
      <path d="M26.418 65.322 A34 34 0 0 0 93.872 57.04" stroke="#1d1b18" strokeWidth="9.5" />
      <path d="M30.972 59.988 A34 34 0 0 1 98.088 51.747" stroke="#c0560f" strokeWidth="9.5" />
    </svg>
  );
}
