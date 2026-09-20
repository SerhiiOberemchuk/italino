import type { CSSProperties } from "react";
import styles from "./brand-logo.module.css";

type BrandLogoProps = {
  className?: string;
  priority?: "primary" | "inverse";
};

export function BrandLogo({ className, priority = "primary" }: BrandLogoProps) {
  return (
    <span
      className={`${styles.logo} ${priority === "inverse" ? styles.inverse : ""} ${className ?? ""}`}
      style={{ "--brand-logo-tone": priority === "inverse" ? "var(--paper)" : "var(--ink)" } as CSSProperties}
    >
      <svg
        className={styles.mark}
        viewBox="0 0 40 40"
        role="img"
        aria-label=""
        aria-hidden="true"
      >
        <rect x="1" y="1" width="38" height="38" rx="12" fill="#14110f" />
        <path d="M15.6 16.2h8.1l-3.25 16.3h-8.1z" fill="#fff7ee" />
        <circle cx="21.25" cy="9.55" r="4.35" fill="#d8ff3e" />
        <circle cx="29.4" cy="29.35" r="3.45" fill="#ff4b2b" />
      </svg>
      <span className={styles.wordmark}>
        italino<span className={styles.period}>.</span>
      </span>
    </span>
  );
}
