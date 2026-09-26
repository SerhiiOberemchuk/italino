"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useVariantSelection } from "@/components/catalog/variant-selection";
import { galleryFor } from "@/lib/catalog/variants";
import styles from "@/app/shop.module.css";

/** Свайп коротший за це — випадковий дотик, не намір гортати фото. */
const SWIPE_THRESHOLD_PX = 40;

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function ChevronGlyph({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {direction === "prev" ? <path d="m15 6-6 6 6 6" /> : <path d="m9 6 6 6-6 6" />}
    </svg>
  );
}

/**
 * Галерея обраного артикула + повноекранний перегляд (нативний `<dialog>`).
 * Фото залежить від вибору в BuyBox через спільний `VariantSelectionProvider`
 * — компонент нічого не приймає пропсами, окрім того, що читає з контексту.
 */
export function ProductGallery() {
  const { variants, selected } = useVariantSelection();
  const images = galleryFor(variants, selected);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pointerStartX = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Новий варіант — нова галерея; попередній відкритий індекс міг вказувати за
  // її межі. Скидаємо синхронно під час рендеру (без ефекту), як радять React
  // docs для «adjusting state when a prop changes» — інакше секунда з
  // невірним індексом устигає промайнути на екрані.
  const [trackedVariantId, setTrackedVariantId] = useState(selected.id);
  if (trackedVariantId !== selected.id) {
    setTrackedVariantId(selected.id);
    setActiveIndex(0);
  }

  if (!images.length) return null;

  function step(delta: number) {
    setActiveIndex((current) => (current + delta + images.length) % images.length);
  }

  function openAt(index: number) {
    setActiveIndex(index);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    pointerStartX.current = event.clientX;
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const start = pointerStartX.current;
    pointerStartX.current = null;
    if (start === null) return;
    const delta = event.clientX - start;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    step(delta > 0 ? -1 : 1);
  }

  return (
    <>
      <div className={styles.gallery}>
        {images.map((src, index) => (
          <button
            type="button"
            key={`${src}-${index}`}
            className={`${styles.galleryItem} ${styles.galleryButton}`}
            onClick={() => openAt(index)}
            aria-label={`Відкрити фото ${index + 1} з ${images.length}`}
          >
            <Image
              src={src}
              alt={`${selected.name}${index ? ` — фото ${index + 1}` : ""}`}
              fill
              sizes="(min-width: 1024px) 35vw, 50vw"
              priority={index === 0}
            />
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className={styles.lightbox}
        aria-label={`Перегляд фото товару «${selected.name}»`}
        onClick={(event) => {
          // Клік по самому <dialog> (не по його вмісту) — це клік «за межами» фото.
          if (event.target === dialogRef.current) close();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") step(-1);
          if (event.key === "ArrowRight") step(1);
        }}
      >
        <button type="button" className={styles.lightboxClose} onClick={close} aria-label="Закрити перегляд">
          <CloseGlyph />
        </button>

        <div className={styles.lightboxImage} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
          <Image
            key={images[activeIndex]}
            src={images[activeIndex]}
            alt={`${selected.name} — фото ${activeIndex + 1}`}
            fill
            sizes="90vw"
          />
        </div>

        {images.length > 1 ? (
          <>
            <button type="button" className={`${styles.lightboxNav} ${styles.lightboxNavPrev}`} onClick={() => step(-1)} aria-label="Попереднє фото">
              <ChevronGlyph direction="prev" />
            </button>
            <button type="button" className={`${styles.lightboxNav} ${styles.lightboxNavNext}`} onClick={() => step(1)} aria-label="Наступне фото">
              <ChevronGlyph direction="next" />
            </button>
            <p className={styles.lightboxCounter} aria-live="polite">{activeIndex + 1} / {images.length}</p>
          </>
        ) : null}
      </dialog>
    </>
  );
}
