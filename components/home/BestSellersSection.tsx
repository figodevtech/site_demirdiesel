"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TrendingUp, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { ProductCard } from "@/components/product/ProductCard";
import { PublicProduct } from "@/lib/catalog/types";
import { Button } from "@/components/ui/button";

interface BestSellersSectionProps {
  products: PublicProduct[];
  title?: string;
  subtitle?: string;
}

export function BestSellersSection({
  products,
  title = "Mais Vendidos",
  subtitle = "Os componentes e módulos mais requisitados por frotas e oficinas com procedência garantida.",
}: BestSellersSectionProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback((emblaApi: CarouselApi) => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!api) return;

    updateScrollState(api);
    api.on("select", () => updateScrollState(api));
    api.on("reInit", () => updateScrollState(api));
  }, [api, updateScrollState]);

  if (!products || products.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 border-t border-border/60 bg-linear-to-b from-white to-slate-50/50 dark:from-background dark:to-slate-900/20">
      <div className="container mx-auto px-4">
        {/* Cabeçalho com Título, Subtítulo e Controles */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Alta Demanda</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              {subtitle}
            </p>
          </div>

          {/* Ações e Controles de Navegação do Carrossel */}
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            <Link
              href="/produtos"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-border/80 hover:border-primary text-foreground hover:text-primary transition-all shadow-2xs"
            >
              <span>Ver Catálogo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Setas Anterior / Próximo */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border/80 hover:border-primary text-foreground disabled:opacity-35 transition-all cursor-pointer"
                onClick={() => api?.scrollPrev()}
                disabled={!canScrollPrev}
                aria-label="Produto anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border/80 hover:border-primary text-foreground disabled:opacity-35 transition-all cursor-pointer"
                onClick={() => api?.scrollNext()}
                disabled={!canScrollNext}
                aria-label="Próximo produto"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Carrossel de Produtos Mais Vendidos */}
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: false,
            dragFree: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-3 sm:-ml-4">
            {products.map((product, idx) => (
              <CarouselItem
                key={product.id}
                className="pl-3 sm:pl-4 basis-[82%] sm:basis-1/2 md:basis-1/3 lg:basis-1/5 xl:basis-1/6"
              >
                <div className="h-full">
                  <ProductCard
                    product={product}
                    rank={idx + 1}
                    priority={idx < 4}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}

export default BestSellersSection;
