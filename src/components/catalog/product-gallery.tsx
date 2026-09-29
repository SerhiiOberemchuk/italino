"use client";

import Image, { getImageProps } from "next/image";
import { useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import Lightbox, { type Labels } from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Inline from "yet-another-react-lightbox/plugins/inline";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import { Skeleton } from "@/components/ui/skeleton";
import { useVariantSelection } from "@/components/catalog/variant-selection";
import { galleryFor } from "@/lib/catalog/variants";
import styles from "./product-gallery.module.css";

const STAGE_SIZES = "(min-width: 1024px) 50vw, 100vw";
/** Вказівник зсунувся далі — це був свайп каруселі, а не клік по фото. */
const CLICK_SLOP_PX = 8;

const LABELS: Labels = {
  Previous: "Попереднє фото",
  Next: "Наступне фото",
  Close: "Закрити перегляд",
  Lightbox: "Перегляд фото товару",
  Carousel: "карусель",
  Slide: "фото",
  "Photo gallery": "Фото товару",
  "{index} of {total}": "{index} з {total}",
  "Zoom in": "Збільшити",
  "Zoom out": "Зменшити",
};

/**
 * Галерея обраного артикула: карусель на сторінці й повноекранний перегляд
 * із зумом (yet-another-react-lightbox). Обидві ділять один індекс, тож
 * перегляд відкривається на тому фото, яке видно, і повертає на те, де закрили.
 * Фото залежить від вибору в BuyBox через спільний `VariantSelectionProvider`.
 */
export function ProductGallery() {
  const { variants, selected } = useVariantSelection();
  const images = galleryFor(variants, selected);
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  // Новий варіант — нова галерея; попередній індекс міг вказувати за її межі.
  // Скидаємо синхронно під час рендеру (без ефекту), як радять React docs для
  // «adjusting state when a prop changes».
  const [trackedVariantId, setTrackedVariantId] = useState(selected.id);
  if (trackedVariantId !== selected.id) {
    setTrackedVariantId(selected.id);
    setIndex(0);
  }

  if (!images.length) return null;

  const current = Math.min(index, images.length - 1);
  const single = images.length < 2;
  const alt = (position: number) => `${selected.name}${position ? ` — фото ${position + 1}` : ""}`;
  const slides = images.map((src, position) => ({ src, alt: alt(position) }));
  // Повноекранний перегляд і зум — з оптимізатора Next (WebP/AVIF), а не з оригіналу CDN.
  const viewerSlides = images.map((src, position) => ({
    src: getImageProps({ src, alt: alt(position), fill: true, sizes: "100vw", quality: 85 }).props.src,
    alt: alt(position),
  }));
  const hideWhenSingle = single ? { buttonPrev: () => null, buttonNext: () => null } : {};

  function rememberPointer(event: ReactPointerEvent) {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  }

  function openViewer(event: ReactMouseEvent) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > CLICK_SLOP_PX) return;
    setViewerOpen(true);
  }

  return (
    <div className={styles.gallery}>
      <div className={styles.stage}>
        {/* Постер: поточне фото вже в HTML, до гідрації й вимірювання каруселі. Альт — у слайдів. */}
        <Image
          src={images[current]}
          alt=""
          aria-hidden
          fill
          sizes={STAGE_SIZES}
          className={styles.image}
          loading="eager"
          fetchPriority="high"
        />
        <Lightbox
          plugins={[Inline]}
          inline={{ className: styles.carousel }}
          slides={slides}
          index={current}
          on={{ view: ({ index: next }) => setIndex(next) }}
          carousel={{ finite: single, padding: 0, spacing: 0, imageFit: "contain", preload: 1 }}
          labels={LABELS}
          render={{
            ...hideWhenSingle,
            slide: ({ slide, offset }) => (
              <button
                type="button"
                className={styles.open}
                aria-label={`Відкрити на весь екран: ${slide.alt ?? selected.name}`}
                onPointerDown={rememberPointer}
                onClick={openViewer}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt ?? ""}
                  fill
                  sizes={STAGE_SIZES}
                  className={styles.image}
                  loading={offset === 0 ? "eager" : "lazy"}
                  draggable={false}
                />
              </button>
            ),
          }}
        />
      </div>

      {single ? null : (
        <div className={styles.thumbs} role="group" aria-label="Мініатюри фото">
          {images.map((src, position) => (
            <button
              type="button"
              key={`${src}-${position}`}
              className={position === current ? `${styles.thumb} ${styles.thumbActive}` : styles.thumb}
              aria-label={`Фото ${position + 1} з ${images.length}`}
              aria-current={position === current}
              onClick={() => setIndex(position)}
            >
              <Image src={src} alt="" fill sizes="72px" />
            </button>
          ))}
        </div>
      )}

      <Lightbox
        open={viewerOpen}
        close={() => setViewerOpen(false)}
        index={current}
        slides={viewerSlides}
        on={{ view: ({ index: next }) => setIndex(next) }}
        plugins={[Zoom, Counter]}
        carousel={{ finite: single }}
        controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
        labels={LABELS}
        counter={{ separator: "з" }}
        className={styles.viewer}
        render={hideWhenSingle}
      />
    </div>
  );
}

/** Скелетон галереї: головне фото є завжди, мініатюри — не в кожної моделі. */
export function ProductGallerySkeleton() {
  return (
    <div className={styles.gallery} aria-hidden="true">
      <div className={styles.stage}>
        <Skeleton variant="block" className={styles.skeleton} />
      </div>
    </div>
  );
}
