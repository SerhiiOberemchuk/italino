import styles from "./skeleton.module.css";

type SkeletonProps = {
  /** `text` — замість слова в рядку тексту; `block` — окрема плашка; `round` — кружечок. */
  variant?: "text" | "block" | "round";
  /** Число — пікселі, рядок — будь-яке CSS-значення (`60%`, `4ch`, `5em`). */
  width?: number | string;
  height?: number | string;
  className?: string;
};

/**
 * Заготовка під контент, що ще вантажиться. Займає місце справжнього елемента,
 * тож після завантаження верстка не стрибає. Для скринрідерів прихована:
 * статус завантаження оголошує блок, що її показує.
 */
export function Skeleton({ variant = "text", width, height, className }: SkeletonProps) {
  return (
    <span
      data-skeleton=""
      aria-hidden="true"
      className={[styles.skeleton, styles[variant], className].filter(Boolean).join(" ")}
      style={{ width, height }}
    />
  );
}
