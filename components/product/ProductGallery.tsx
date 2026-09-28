"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ProductFallbackImage } from "./ProductFallbackImage";

interface ProductGalleryProps {
  images: string[];
  productTitle: string;
  categoryName?: string;
}

export function ProductGallery({ images, productTitle, categoryName = "" }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasError, setHasError] = useState<Record<number, boolean>>({});

  const validImages = images.filter((img) => img && img.trim() !== "");
  const currentImage = validImages[selectedIndex] || validImages[0] || "";
  const isCurrentError = hasError[selectedIndex];

  return (
    <div className="flex flex-col gap-4">
      {/* Imagem Principal em Destaque */}
      <div className="relative aspect-square w-full rounded-2xl bg-white dark:bg-slate-900 border border-border/80 overflow-hidden shadow-xs flex items-center justify-center p-4 md:p-8">
        {currentImage && !isCurrentError ? (
          <Image
            src={currentImage}
            alt={productTitle}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-4 transition-all duration-300"
            onError={() => setHasError((prev) => ({ ...prev, [selectedIndex]: true }))}
          />
        ) : (
          <ProductFallbackImage category={categoryName} />
        )}
      </div>

      {/* Miniaturas da Galeria */}
      {validImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          {validImages.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            const isThumbError = hasError[idx];

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative w-20 h-20 shrink-0 rounded-xl bg-white dark:bg-slate-900 p-1 overflow-hidden transition-all duration-200 border-2 ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 shadow-xs"
                    : "border-border/60 hover:border-slate-400 opacity-80 hover:opacity-100"
                }`}
                aria-label={`Visualizar imagem ${idx + 1}`}
              >
                {!isThumbError ? (
                  <Image
                    src={img}
                    alt={`${productTitle} miniatura ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-contain p-1"
                    onError={() => setHasError((prev) => ({ ...prev, [idx]: true }))}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[9px] text-slate-400">
                    Foto
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
