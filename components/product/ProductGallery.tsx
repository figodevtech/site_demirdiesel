"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { ProductFallbackImage } from "./ProductFallbackImage";

interface ProductGalleryProps {
  images: string[];
  productTitle: string;
  categoryName?: string;
}

/**
 * Galeria com swipe nativo (scroll-snap): desliza com o dedo no celular, sem biblioteca extra.
 * Miniaturas no desktop; indicador de posição no mobile.
 */
export function ProductGallery({ images, productTitle, categoryName = "" }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasError, setHasError] = useState<Record<number, boolean>>({});
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  const validImages = images.filter((img) => img && img.trim() !== "");
  const hasMultiple = validImages.length > 1;

  const handleScroll = () => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      const track = trackRef.current;
      if (!track || track.clientWidth === 0) return;
      const index = Math.round(track.scrollLeft / track.clientWidth);
      setSelectedIndex((current) => (current === index ? current : index));
    });
  };

  const goTo = (index: number) => {
    const track = trackRef.current;
    setSelectedIndex(index);
    if (!track) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: index * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const markError = (index: number) => setHasError((prev) => ({ ...prev, [index]: true }));

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-900/10 dark:bg-slate-900 dark:shadow-black/30">
        {validImages.length === 0 ? (
          <div className="flex aspect-square w-full items-center justify-center">
            <ProductFallbackImage category={categoryName} />
          </div>
        ) : (
          <div
            ref={trackRef}
            onScroll={hasMultiple ? handleScroll : undefined}
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
            aria-roledescription={hasMultiple ? "carrossel" : undefined}
            aria-label={hasMultiple ? `Fotos de ${productTitle}` : undefined}
          >
            {validImages.map((img, index) => (
              <div
                key={`${img}-${index}`}
                className="relative flex aspect-square w-full shrink-0 snap-center snap-always items-center justify-center p-4 md:p-8"
                aria-roledescription={hasMultiple ? "foto" : undefined}
                aria-label={hasMultiple ? `${index + 1} de ${validImages.length}` : undefined}
              >
                {!hasError[index] ? (
                  <Image
                    src={img}
                    alt={index === 0 ? productTitle : `${productTitle} - foto ${index + 1}`}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain p-4"
                    draggable={false}
                    onError={() => markError(index)}
                  />
                ) : (
                  <ProductFallbackImage category={categoryName} />
                )}
              </div>
            ))}
          </div>
        )}

        {hasMultiple && (
          <>
            <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-slate-900/70 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white">
              {selectedIndex + 1}/{validImages.length}
            </span>
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden" aria-hidden="true">
              {validImages.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    index === selectedIndex ? "w-5 bg-primary" : "w-1.5 bg-slate-300"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Miniaturas (desktop/tablet) */}
      {hasMultiple && (
        <div className="hidden items-center gap-3 overflow-x-auto pb-2 no-scrollbar md:flex">
          {validImages.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => goTo(idx)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 transition-all duration-200 dark:bg-slate-900 ${
                  isSelected
                    ? "border-primary shadow-xs ring-2 ring-primary/20"
                    : "border-border/60 opacity-80 hover:border-slate-400 hover:opacity-100"
                }`}
                aria-label={`Visualizar imagem ${idx + 1}`}
                aria-current={isSelected ? "true" : undefined}
              >
                {!hasError[idx] ? (
                  <Image
                    src={img}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-contain p-1"
                    onError={() => markError(idx)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[9px] text-slate-400">Foto</div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
